import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { AccessTokenModel } from '@Apps/shared/spotify/models/access-token.model';
import { FlagsmithService } from '@Apps/shared/flagsmith/services/flagsmith.service';
import { RedisService } from '@Apps/shared/redis/services/redis.service';
import { ClientsUnavailableException } from '@Apps/shared/exceptions/clients-unavailable.exception';

interface Client {
  id: string;
  secret: string;
}

@Injectable()
export class SpotifyService {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;
  private currentClientIndex: number = 0;
  private currentClientId: string | null = null;
  private readonly TOKEN_URL = 'https://accounts.spotify.com/api/token';
  private readonly CLIENT_UNAVAILABLE_TTL_SECONDS = 5 * 60; // 5 minutes

  constructor(
    private readonly flagsmithService: FlagsmithService,
    private readonly redisService: RedisService,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.isTokenValid()) {
      return this.cachedToken;
    }

    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.fetchNewToken();
    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  invalidateToken(): void {
    this.cachedToken = null;
    this.tokenExpiresAt = null;
    this.currentClientId = null;
  }

  async requestWithAuth<T>(
    requestFn: (token: string) => Promise<T>,
  ): Promise<T> {
    let token = await this.getAccessToken();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        return await requestFn(token);
      } catch (error) {
        if (this.isUnauthorizedError(error)) {
          this.invalidateToken();
          token = await this.getAccessToken();
          attempts++;
          continue;
        }

        if (this.isRateLimitError(error)) {
            await this.markClientUnavailable(this.currentClientId);
          
          this.invalidateToken();
          
          token = await this.getAccessToken();
          attempts++;
          continue;
        }

        throw error;
      }
    }

    throw new Error('Max retry attempts reached');
  }

  private async getNextAvailableClient(): Promise<Client | null> {
    const clients = await this.flagsmithService.getAvailableClients();
    
    if (clients.length === 0) {
      return null;
    }

    const availableClients: Client[] = [];
    for (const client of clients) {
      const isAvailable = await this.redisService.isClientAvailable(client.id);
      if (isAvailable) {
        availableClients.push(client);
      }
    }

    if (availableClients.length === 0) {
      throw new ClientsUnavailableException();
    }

    const selectedClient = availableClients[this.currentClientIndex % availableClients.length];
    this.currentClientIndex = (this.currentClientIndex + 1) % availableClients.length;

    return selectedClient;
  }

  private async markClientUnavailable(clientId: string): Promise<void> {
    await this.redisService.markClientUnavailable(
      clientId,
      this.CLIENT_UNAVAILABLE_TTL_SECONDS,
    );
  }

  private async fetchNewToken(): Promise<string> {
    const client = await this.getNextAvailableClient();
    
    if (!client) {
      throw new ClientsUnavailableException();
    }

    const decryptedSecret = this.flagsmithService.decryptSecret(client.secret);

    const response = await axios.post<AccessTokenModel>(
      this.TOKEN_URL,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${client.id}:${decryptedSecret}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const data = response.data;
    const token = `Bearer ${data.access_token}`;

    this.cachedToken = token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    this.currentClientId = client.id;

    return token;
  }

  private isTokenValid(): boolean {
    if (!this.tokenExpiresAt) {
      return false;
    }
    return Date.now() < this.tokenExpiresAt;
  }

  private isUnauthorizedError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return axiosError.response?.status === 401;
    }
    return false;
  }

  private isRateLimitError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      return axiosError.response?.status === 429;
    }
    return false;
  }
}

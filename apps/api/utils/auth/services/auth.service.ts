import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { AccessTokenModel } from '@Utils/auth/models/access-token.model';

@Injectable()
export class AuthService {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;
  private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  private readonly clientId = process.env.SPOTIFY_CLIENT_ID;
  private readonly TOKEN_URL = 'https://accounts.spotify.com/api/token';

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
  }

  async requestWithAuth<T>(
    requestFn: (token: string) => Promise<T>,
  ): Promise<T> {
    let token = await this.getAccessToken();

    try {
      return await requestFn(token);
    } catch (error) {
      if (this.isUnauthorizedError(error)) {
        this.invalidateToken();
        token = await this.getAccessToken();
        return await requestFn(token);
      }
      throw error;
    }
  }

  private async fetchNewToken(): Promise<string> {
    const response = await axios.post<AccessTokenModel>(
      this.TOKEN_URL,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`,
          ).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const data = response.data;
    const token = `Bearer ${data.access_token}`;

    this.cachedToken = token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

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
}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly SPOTIFY_SERVICE_STATUS_KEY = 'SPOTIFY_SERVICE_STATUS';
  private readonly CLIENT_UNAVAILABLE_KEY_PREFIX = 'client:unavailable:';

  constructor() {
    const redisConfig: any = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };

    if (process.env.REDIS_USERNAME) {
      redisConfig.username = process.env.REDIS_USERNAME;
    }
    if (process.env.REDIS_PASSWORD) {
      redisConfig.password = process.env.REDIS_PASSWORD;
    }

    this.client = new Redis(redisConfig);
  }

  async onModuleInit() {
    const exists = await this.client.exists(this.SPOTIFY_SERVICE_STATUS_KEY);
    if (!exists) {
      await this.client.set(this.SPOTIFY_SERVICE_STATUS_KEY, 'true');
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async updateSpotifyStatus(status: boolean): Promise<void> {
    await this.client.set(this.SPOTIFY_SERVICE_STATUS_KEY, status ? 'true' : 'false');
  }

  async checkSpotifyStatus(): Promise<boolean> {
    const value = await this.client.get(this.SPOTIFY_SERVICE_STATUS_KEY);
    if (value === null) {
      await this.client.set(this.SPOTIFY_SERVICE_STATUS_KEY, 'true');
      return true;
    }
    return value === 'true';
  }

  async markClientUnavailable(clientId: string, ttlSeconds: number): Promise<void> {
    const key = this.getClientUnavailableKey(clientId);
    await this.client.setex(key, ttlSeconds, '1');
  }

  async isClientAvailable(clientId: string): Promise<boolean> {
    const key = this.getClientUnavailableKey(clientId);
    const exists = await this.client.exists(key);
    return !exists;
  }

  getClientUnavailableKey(clientId: string): string {
    return `${this.CLIENT_UNAVAILABLE_KEY_PREFIX}${clientId}`;
  }

  async clearClientUnavailable(clientId: string): Promise<void> {
    const key = this.getClientUnavailableKey(clientId);
    await this.client.del(key);
  }
}

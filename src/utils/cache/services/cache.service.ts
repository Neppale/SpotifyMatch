import { Cache } from 'cache-manager';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { CacheClient } from './useCases/cache-client';
import { CACHE_MANAGER, Inject } from '@nestjs/common';

@Injectable()
export class CacheService implements CacheClient {
  cacheManager: Cache;

  constructor(@Inject(CACHE_MANAGER) cacheManager: Cache) {
    this.cacheManager = cacheManager;
  }

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    await this.cacheManager.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async flush(): Promise<void> {
    await this.cacheManager.reset();
  }
}

import { CacheService } from '../../../services/cache.service';
import { Cache } from 'cache-manager';

export class CacheServiceSpy implements CacheService {
  cacheManager: Cache;
  getCount = 0;
  setCount = 0;
  delCount = 0;
  flushCount = 0;
  response: any;

  async get(_key: string): Promise<any> {
    this.getCount++;
    return this.response;
  }
  async set(_key: string, _value: any): Promise<void> {
    this.setCount++;
    return;
  }
  async del(_key: string): Promise<void> {
    this.delCount++;
    return;
  }
  async flush(): Promise<void> {
    this.flushCount++;
    return;
  }
}

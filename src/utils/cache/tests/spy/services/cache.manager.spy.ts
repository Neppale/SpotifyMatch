import { Cache, Store, WrapArgsType } from 'cache-manager';
export class CacheManagerSpy implements Cache {
  store: Store;
  getCount = 0;
  setCount = 0;
  delCount = 0;
  flushCount = 0;
  resetCount = 0;
  wrapCount = 0;
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
  async reset(): Promise<void>;
  reset(cb: () => void): void;
  reset(_cb?: unknown): void | Promise<void> {
    this.resetCount++;
    return;
  }
  async wrap<T>(..._args: WrapArgsType<T>[]): Promise<T> {
    this.wrapCount++;
    return this.response as T;
  }
}

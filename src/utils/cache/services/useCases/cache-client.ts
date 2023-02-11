export interface CacheClient {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  del(key: string): Promise<void>;
  flush(): Promise<void>;
}

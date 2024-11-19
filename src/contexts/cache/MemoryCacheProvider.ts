import {ICacheContext} from './types.js';

export class MemoryCacheProvider implements ICacheContext {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

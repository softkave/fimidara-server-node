import {convertToArray} from 'softkave-js-utils';
import {ICacheContext} from './types.js';

export class MemoryCacheProvider implements ICacheContext {
  private cache: Map<string, any>;

  constructor() {
    this.cache = new Map();
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.cache.get(key) ?? null);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? (value as T) : null;
  }

  getList(keys: string[]): Promise<Array<string | null>> {
    return Promise.resolve(keys.map(key => this.cache.get(key) ?? null));
  }

  async getJsonList<T>(keys: string[]): Promise<Array<T | null>> {
    const values = await this.getList(keys);
    return values as Array<T | null>;
  }

  async set(
    key: string,
    value: string | Buffer,
    opts?: {ttlMs?: number}
  ): Promise<void> {
    this.cache.set(key, value);
    if (opts?.ttlMs) {
      setTimeout(() => this.cache.delete(key), opts.ttlMs);
    }
  }

  async setJson<T>(
    key: string,
    value: T,
    opts?: {ttlMs?: number}
  ): Promise<void> {
    this.cache.set(key, value);
    if (opts?.ttlMs) {
      setTimeout(() => this.cache.delete(key), opts.ttlMs);
    }
  }

  async setList(
    list: Array<{key: string; value: string | Buffer}>
  ): Promise<void> {
    list.forEach(({key, value}) => this.cache.set(key, value));
  }

  async setJsonList<T>(list: Array<{key: string; value: T}>): Promise<void> {
    list.forEach(({key, value}) => this.cache.set(key, value));
  }

  async delete(key: string | string[]): Promise<void> {
    convertToArray(key).forEach(key => this.cache.delete(key));
  }
}

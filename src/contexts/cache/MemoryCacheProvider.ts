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

  getJson<T>(key: string): Promise<T | null> {
    return this.get(key).then(value => (value ? JSON.parse(value) : null));
  }

  getList(keys: string[]): Promise<Array<string | null>> {
    return Promise.resolve(keys.map(key => this.cache.get(key) ?? null));
  }

  getJsonList<T>(keys: string[]): Promise<Array<T | null>> {
    return this.getList(keys).then(values =>
      values.map(value => (value ? JSON.parse(value) : null))
    );
  }

  async set(key: string, value: string | Buffer): Promise<void> {
    this.cache.set(key, value);
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    await this.set(key, JSON.stringify(value));
  }

  async setList(
    list: Array<{key: string; value: string | Buffer}>
  ): Promise<void> {
    list.forEach(({key, value}) => this.cache.set(key, value));
  }

  async setJsonList<T>(list: Array<{key: string; value: T}>): Promise<void> {
    await this.setList(
      list.map(({key, value}) => ({key, value: JSON.stringify(value)}))
    );
  }

  async delete(key: string | string[]): Promise<void> {
    convertToArray(key).forEach(key => this.cache.delete(key));
  }
}

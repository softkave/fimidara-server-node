import {RedisClientType} from 'redis';
import {convertToArray} from 'softkave-js-utils';
import {ICacheContext} from './types.js';

export class RedisCacheProvider implements ICacheContext {
  constructor(protected redis: RedisClientType) {}

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  getJson<T>(key: string): Promise<T | null> {
    return this.redis
      .get(key)
      .then(value => (value ? JSON.parse(value) : null));
  }

  getList(keys: string[]): Promise<Array<string | null>> {
    return this.redis.mGet(keys);
  }

  getJsonList<T>(keys: string[]): Promise<Array<T | null>> {
    return this.redis
      .mGet(keys)
      .then(values => values.map(value => (value ? JSON.parse(value) : null)));
  }

  async set(key: string, value: string | Buffer): Promise<void> {
    await this.redis.set(key, value);
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    await this.redis.set(key, JSON.stringify(value));
  }

  async setList(
    list: Array<{key: string; value: string | Buffer}>
  ): Promise<void> {
    await this.redis.mSet(
      list.map(({key, value}) => [key, value] as [string, string | Buffer])
    );
  }

  async setJsonList<T>(list: Array<{key: string; value: T}>): Promise<void> {
    await this.redis.mSet(
      list.map(
        ({key, value}) => [key, JSON.stringify(value)] as [string, string]
      )
    );
  }

  async delete(key: string | string[]): Promise<void> {
    await this.redis.del(convertToArray(key));
  }
}

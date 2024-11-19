import {RedisClientType} from 'redis';
import {ICacheContext} from './types.js';

export class RedisCacheProvider implements ICacheContext {
  constructor(protected redis: RedisClientType) {}

  get = async <T>(key: string): Promise<T | null> => {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  };

  set = async <T>(key: string, value: T): Promise<void> => {
    await this.redis.set(key, JSON.stringify(value));
  };

  delete = async (key: string): Promise<void> => {
    await this.redis.del(key);
  };
}

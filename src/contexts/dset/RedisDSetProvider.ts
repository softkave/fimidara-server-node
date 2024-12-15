import {RedisClientType} from 'redis';
import {convertToArray, OrArray} from 'softkave-js-utils';
import {IDSetContext} from './types.js';

export class RedisDSetProvider implements IDSetContext {
  constructor(protected redis: RedisClientType) {}

  async add(key: string, value: OrArray<string | Buffer>): Promise<void> {
    const values = convertToArray(value);
    await this.redis.sAdd(key, values);
  }

  async delete(key: string, value?: OrArray<string | Buffer>): Promise<void> {
    if (value) {
      const values = convertToArray(value);
      await this.redis.sRem(key, values);
    } else {
      await this.redis.del(key);
    }
  }

  async has(key: string, value: string | Buffer): Promise<boolean> {
    return this.redis.sIsMember(key, value);
  }

  async size(key: string): Promise<number> {
    return this.redis.sCard(key);
  }

  async scan(
    key: string,
    opts: {cursor?: number; size?: number}
  ): Promise<{values: Array<string | Buffer>; cursor: number; done: boolean}> {
    const {cursor, size} = opts;
    const scanOptions = size ? {COUNT: size} : {};
    const {cursor: newCursor, members: values} = await this.redis.sScan(
      key,
      cursor ?? 0,
      scanOptions
    );
    return {values, cursor: newCursor, done: newCursor === 0};
  }

  async getAll(key: string): Promise<Array<string>> {
    return this.redis.sMembers(key);
  }
}

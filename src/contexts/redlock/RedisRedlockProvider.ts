import {Redlock, ResourceLockedError} from '@sesamecare-oss/redlock';
import Redis from 'ioredis';
import {convertToArray} from 'softkave-js-utils';
import {InvalidStateError} from '../../endpoints/errors.js';
import {IAcquireLockOptions, IRedlockContext} from './types.js';

export class RedisRedlockProvider implements IRedlockContext {
  protected redlock: Redlock;

  constructor(protected readonly redis: Redis.Redis | Redis.Redis[]) {
    this.redlock = new Redlock(convertToArray(redis), {
      driftFactor: 0.01, // time in ms
      retryCount: 2,
      retryDelay: 200, // time in ms
      retryJitter: 200, // time in ms
    });
  }

  async using<T>(
    key: string | string[],
    duration: number,
    fn: (signal: AbortSignal) => Promise<T>,
    options?: IAcquireLockOptions
  ): Promise<T> {
    try {
      return await this.redlock.using(
        convertToArray(key),
        duration,
        {retryCount: options?.retryCount},
        fn
      );
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        throw new InvalidStateError('Resource not available');
      }

      throw error;
    }
  }

  async dispose(): Promise<void> {
    await Promise.all(convertToArray(this.redis).map(redis => redis.quit()));
  }
}

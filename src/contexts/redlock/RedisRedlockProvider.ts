import {
  ExecutionError,
  Redlock,
  ResourceLockedError,
} from '@sesamecare-oss/redlock';
import Redis from 'ioredis';
import {convertToArray} from 'softkave-js-utils';
import {ResourceLockedError as FimidaraResourceLockedError} from '../../endpoints/errors.js';
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
        {retryCount: options?.retryCount ?? 2},
        fn
      );
    } catch (error) {
      if (error instanceof ResourceLockedError) {
        throw new FimidaraResourceLockedError();
      } else if (error instanceof ExecutionError) {
        const attempts = await Promise.all(error.attempts);
        const votesAgainst = attempts.map(attempt => attempt.votesAgainst);
        const votesAgainstError = votesAgainst
          .map(vote => Array.from(vote.values()))
          .flat();
        const hasResourceLockedError = votesAgainstError.some(
          error => error instanceof ResourceLockedError
        );

        if (hasResourceLockedError) {
          throw new FimidaraResourceLockedError();
        }
      }

      throw error;
    }
  }
}

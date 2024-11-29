import assert from 'assert';
import Redis from 'ioredis';
import {getDeferredPromise} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {InvalidStateError} from '../../../endpoints/errors.js';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisRedlockProvider} from '../RedisRedlockProvider.js';

let redis: Redis.Redis | undefined;
const database = 4;

beforeAll(async () => {
  await initTests();
  const {redlockRedisURL, redlockDatabase} = kUtilsInjectables.suppliedConfig();
  assert.ok(redlockRedisURL);
  redis = await new Redis.default({path: redlockRedisURL, db: redlockDatabase});
  await redis.connect();
});

afterAll(async () => {
  await redis?.select(database);
  await redis?.flushdb();
  await redis?.quit();
  await completeTests();
});

describe('RedisRedlockProvider', () => {
  test('should acquire and release a lock', async () => {
    assert.ok(redis);
    const provider = new RedisRedlockProvider(redis);
    const result = await provider.using('test', 1000, async () => 'test');
    expect(result).toBe('test');
  });

  test('should throw an error if the resource is not available', async () => {
    assert.ok(redis);
    const provider = new RedisRedlockProvider(redis);
    const p = getDeferredPromise();
    // return a promise that never resolves
    provider.using('test', 1000, () => p.promise);
    await expect(
      // attempt to acquire the lock again should throw
      provider.using('test', 1000, async () => 'test', {retryCount: 0})
    ).rejects.toThrow(InvalidStateError);
    p.resolve();
  });
});

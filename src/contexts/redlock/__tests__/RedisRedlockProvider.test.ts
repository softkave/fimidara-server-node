import {getDeferredPromise, waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {InvalidStateError} from '../../../endpoints/errors.js';
import {completeTests} from '../../../endpoints/testUtils/helpers/testFns.js';
import {initTests} from '../../../endpoints/testUtils/testUtils.js';
import {kUtilsInjectables} from '../../injection/injectables.js';
import {RedisRedlockProvider} from '../RedisRedlockProvider.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisRedlockProvider', () => {
  test('should acquire and release a lock', async () => {
    const [ioRedis] = kUtilsInjectables.ioredis();
    const provider = new RedisRedlockProvider(ioRedis);
    const key = 'test' + Math.random();
    const result = await provider.using(key, 2000, async () => 'test');
    expect(result).toBe('test');
  });

  test('should throw an error if the resource is not available', async () => {
    const [ioRedis] = kUtilsInjectables.ioredis();
    const provider = new RedisRedlockProvider(ioRedis);
    const p = getDeferredPromise();
    const key = 'test' + Math.random();
    // return a promise that never resolves
    provider.using(key, 5000, () => p.promise);
    await waitTimeout(500);
    await expect(
      // attempt to acquire the lock again should throw
      provider.using(key, 1000, async () => 'test', {retryCount: 0})
    ).rejects.toThrow(InvalidStateError);
    p.resolve();
  });
});

import {getDeferredPromise, waitTimeout} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {ResourceLockedError as FimidaraResourceLockedError} from '../../../endpoints/errors.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxUtils} from '../../ijx/injectables.js';
import {RedisRedlockProvider} from '../RedisRedlockProvider.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('RedisRedlockProvider', () => {
  test('should acquire and release a lock', async () => {
    const [ioRedis] = kIjxUtils.ioredis();
    const provider = new RedisRedlockProvider(ioRedis);
    const key = 'test' + Math.random();
    const result = await provider.using(key, 2000, async () => 'test');
    expect(result).toBe('test');

    // can acquire the lock again
    const result2 = await provider.using(key, 2000, async () => 'test');
    expect(result2).toBe('test');
  });

  test('should retry acquiring the lock', async () => {
    const [ioRedis] = kIjxUtils.ioredis();
    const provider = new RedisRedlockProvider(ioRedis);
    const key = 'test' + Math.random();
    const p = getDeferredPromise<string>();
    const pResult01 = provider.using(key, 600, () => p.promise);
    await waitTimeout(50);
    const pResult02 = provider.using(key, 600, () => Promise.resolve('test'), {
      retryCount: 10,
    });
    await waitTimeout(700);
    p.resolve('test');
    const result01 = await pResult01;
    const result02 = await pResult02;
    expect(result01).toBe('test');
    expect(result02).toBe('test');
  });

  test('should throw an error if the resource is not available', async () => {
    const [ioRedis] = kIjxUtils.ioredis();
    const provider = new RedisRedlockProvider(ioRedis);
    const p = getDeferredPromise();
    const key = 'test' + Math.random();
    // return a promise that never resolves
    provider.using(key, 5000, () => p.promise);
    await waitTimeout(500);
    await expect(
      // attempt to acquire the lock again should throw
      provider.using(key, 1000, async () => 'test', {retryCount: 0})
    ).rejects.toThrow(FimidaraResourceLockedError);
    p.resolve();
  });
});

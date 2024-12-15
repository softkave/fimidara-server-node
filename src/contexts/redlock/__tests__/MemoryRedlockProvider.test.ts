import {getDeferredPromise, waitTimeout} from 'softkave-js-utils';
import {describe, expect, test} from 'vitest';
import {ResourceLockedError as FimidaraResourceLockedError} from '../../../endpoints/errors.js';
import {MemoryRedlockProvider} from '../MemoryRedlockProvider.js';

describe('MemoryRedlockProvider', () => {
  test('should acquire and release a lock', async () => {
    const provider = new MemoryRedlockProvider();
    const result = await provider.using('test', 1000, async () => 'test');
    expect(result).toBe('test');

    // can acquire the lock again
    const result2 = await provider.using('test', 1000, async () => 'test');
    expect(result2).toBe('test');
  });

  test('should retry acquiring the lock', async () => {
    const provider = new MemoryRedlockProvider();
    const key = 'test' + Math.random();
    const p = getDeferredPromise<string>();
    const pResult01 = provider.using(key, 100, () => p.promise);
    await waitTimeout(50);
    const pResult02 = provider.using(key, 100, () => p.promise, {
      retryCount: 3,
    });
    await waitTimeout(150);
    p.resolve('test');
    const result01 = await pResult01;
    const result02 = await pResult02;
    expect(result01).toBe('test');
    expect(result02).toBe('test');
  });

  test('should throw an error if the resource is not available', async () => {
    const provider = new MemoryRedlockProvider();
    // return a promise that never resolves
    const p = getDeferredPromise();
    provider.using('test', 1000, () => p.promise);
    await waitTimeout(50);
    await expect(
      // attempt to acquire the lock again should throw
      provider.using('test', 1000, async () => 'test')
    ).rejects.toThrow(FimidaraResourceLockedError);
  });
});

import {describe, expect, test} from 'vitest';
import {ResourceLockedError as FimidaraResourceLockedError} from '../../../endpoints/errors.js';
import {MemoryRedlockProvider} from '../MemoryRedlockProvider.js';

describe('MemoryRedlockProvider', () => {
  test('should acquire and release a lock', async () => {
    const provider = new MemoryRedlockProvider();
    const result = await provider.using('test', 1000, async () => 'test');
    expect(result).toBe('test');
  });

  test('should throw an error if the resource is not available', async () => {
    const provider = new MemoryRedlockProvider();
    // return a promise that never resolves
    provider.using('test', 1000, () => new Promise(() => {}));
    await expect(
      // attempt to acquire the lock again should throw
      provider.using('test', 1000, async () => 'test')
    ).rejects.toThrow(FimidaraResourceLockedError);
  });
});

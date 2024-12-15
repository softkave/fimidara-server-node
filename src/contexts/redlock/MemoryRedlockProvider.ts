import {getRandomInt, LockStore, waitTimeout} from 'softkave-js-utils';
import {ResourceLockedError as FimidaraResourceLockedError} from '../../endpoints/errors.js';
import {IRedlockContext} from './types.js';

/** NOTE: This is not a real implementation of Redlock. It is a simple in-memory
 * lock store. It also does not support `duration`. */
export class MemoryRedlockProvider implements IRedlockContext {
  protected lockStore = new LockStore();

  async using<T>(
    key: string,
    duration: number,
    fn: (signal: AbortSignal) => Promise<T>,
    options: {retryCount?: number} = {}
  ): Promise<T> {
    await this.acquireWithRetry(key, options.retryCount ?? 0);
    return this.lockStore.run(key, () => fn(new AbortController().signal));
  }

  async dispose(): Promise<void> {
    // no-op
  }

  protected async acquireWithRetry(
    key: string,
    retryCount: number
  ): Promise<void> {
    const hasLock = this.lockStore.has(key);
    if (hasLock) {
      if (retryCount <= 0) {
        throw new FimidaraResourceLockedError();
      }

      retryCount -= 1;
      await waitTimeout(getRandomInt(80, 150));
      return this.acquireWithRetry(key, retryCount);
    }
  }
}

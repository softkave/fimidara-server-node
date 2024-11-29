import {LockStore} from 'softkave-js-utils';
import {InvalidStateError} from '../../endpoints/errors.js';
import {IRedlockContext} from './types.js';

/** NOTE: This is not a real implementation of Redlock. It is a simple in-memory
 * lock store. It also does not support `duration` or `options` in `using(...)`. */
export class MemoryRedlockProvider implements IRedlockContext {
  protected lockStore = new LockStore();

  async using<T>(
    key: string,
    duration: number,
    fn: (signal: AbortSignal) => Promise<T>
  ): Promise<T> {
    if (this.lockStore.has(key)) {
      throw new InvalidStateError('Resource not available');
    }

    return this.lockStore.run(key, () => fn(new AbortController().signal));
  }

  async dispose(): Promise<void> {
    // no-op
  }
}

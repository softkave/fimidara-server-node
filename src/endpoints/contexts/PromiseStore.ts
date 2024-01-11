import {serverLogger} from '../../utils/logger/loggerUtils';
import {AnyFn} from '../../utils/types';

function generateId() {
  return `${Date.now()}-${Math.random()}`;
}

export class PromiseStore {
  protected promiseRecord: Record<string, Promise<unknown>> = {};
  protected isClosed = false;

  add(promise: unknown, id = generateId()) {
    this.failInsertIfClosed();
    this.replace(promise, id);

    return this;
  }

  /** Merge an existing promise and a new one into one new one, resolved when
   * both are resolved. Uses Promise.all() */
  merge(promise: unknown, id: string, forget = true) {
    this.failInsertIfClosed();
    const existingPromise = this.promiseRecord[id];

    if (existingPromise) {
      this.replace(Promise.all([existingPromise, promise]), id, forget);
    } else {
      this.add(promise, id);
    }

    return this;
  }

  /** Merge an existing promise and a new one into one new one, resolved when
   * both are resolved. Existing promise is resolved before the new one. */
  after(promise: unknown, id: string, forget = true) {
    this.failInsertIfClosed();
    const existingPromise = this.promiseRecord[id];

    if (existingPromise) {
      const newPromise = (async () => {
        await existingPromise;
        await promise;
      })();
      this.replace(newPromise, id, forget);
    } else {
      this.add(promise, id);
    }

    return this;
  }

  /** Execute `fn` after promise with `id` resolves or fails. */
  executeAfter<TFn extends AnyFn>(fn: TFn, id: string) {
    const existingPromise = this.promiseRecord[id] || Promise.resolve();
    existingPromise.finally(() => fn());
    return this.add(fn(), id);
  }

  /** Add a promise, but handle it's failure if it fails and do nothing. */
  forget(promise: unknown, id?: string) {
    if (!(promise instanceof Promise)) {
      return;
    }

    this.add(
      promise.catch(error => serverLogger.error(error)),
      id
    );

    return this;
  }

  /** Returns a promise resolved when all the promises at the time of calling
   * are resolved. This does not include promises stored after this call. */
  async flush() {
    await Promise.allSettled(Object.values(this.promiseRecord));
  }

  /** Prevents addition of new promises. */
  close() {
    this.isClosed = true;
    return this;
  }

  get(id: string) {
    return this.promiseRecord[id];
  }

  protected failInsertIfClosed() {
    if (this.isClosed) {
      throw new Error('PromiseStore is closed.');
    }
  }

  protected replace(promise: unknown, id: string, forget = false) {
    this.failInsertIfClosed();

    if (!(promise instanceof Promise)) {
      return;
    }

    this.promiseRecord[id] = promise;

    if (forget) {
      promise.catch(error => serverLogger.error(error));
    }

    promise.finally(() => {
      delete this.promiseRecord[id];
    });
  }
}

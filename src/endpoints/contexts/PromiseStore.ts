import {serverLogger} from '../../utils/logger/loggerUtils';
import {AnyFn} from '../../utils/types';

function generateId() {
  return `${Date.now()}-${Math.random()}`;
}

export class PromiseStore {
  protected promiseMap: Record<string, Promise<unknown>> = {};
  protected isClosed = false;

  add(promise: unknown, id = generateId()) {
    this.failInsertIfClosed();
    this.replace(promise, id);

    return this;
  }

  merge(promise: unknown, id: string, forget = true) {
    this.failInsertIfClosed();
    const existingPromise = this.promiseMap[id];

    if (existingPromise) {
      this.replace(Promise.all([existingPromise, promise]), id, forget);
    } else {
      this.add(promise, id);
    }

    return this;
  }

  after(promise: unknown, id: string, forget = true) {
    this.failInsertIfClosed();
    const existingPromise = this.promiseMap[id];

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

  executeAfter<TFn extends AnyFn>(fn: TFn, id: string) {
    const existingPromise = this.promiseMap[id] || Promise.resolve();
    existingPromise.finally(() => fn());
    return this.add(fn(), id);
  }

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
    await Promise.allSettled(Object.values(this.promiseMap));
  }

  /** Prevents addition of new promises. */
  close() {
    this.isClosed = true;
    return this;
  }

  get(id: string) {
    return this.promiseMap[id];
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

    this.promiseMap[id] = promise;

    if (forget) {
      promise.catch(error => serverLogger.error(error));
    }

    promise.finally(() => {
      delete this.promiseMap[id];
    });
  }
}

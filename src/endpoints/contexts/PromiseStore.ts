import {serverLogger} from '../../utils/logger/loggerUtils';

export class PromiseStore {
  protected promiseMap: Record<string, unknown> = {};
  protected isClosed = false;

  add(promise: unknown) {
    if (this.isClosed) {
      throw new Error('PromiseStore is closed');
    }

    if (!(promise instanceof Promise)) {
      return;
    }

    const id = `${Date.now()}-${Math.random()}`;
    this.promiseMap[id] = promise;
    promise.finally(() => {
      delete this.promiseMap[id];
    });

    return this;
  }

  forget(promise: unknown) {
    if (!(promise instanceof Promise)) {
      return;
    }

    this.add(promise.catch(error => serverLogger.error(error)));
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
}

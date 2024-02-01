import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {PartialRecord} from './types';

function generateId() {
  return `${Date.now()}-${Math.random()}`;
}

export class PromiseStore {
  protected promiseRecord: PartialRecord<string, Promise<unknown>> = {};
  protected isClosed = false;

  /** Add a promise, but handle it's failure if it fails and do nothing. */
  forget(promise: unknown) {
    const id: string = generateId();
    this.replace(promise, id, /** forget */ true);
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

  protected assertNotClosed() {
    if (this.isClosed) {
      throw new Error('PromiseStore is closed.');
    }
  }

  protected replace(promise: unknown, id: string, forget = false) {
    this.assertNotClosed();

    if (!(promise instanceof Promise)) {
      return;
    }

    this.promiseRecord[id] = promise;
    promise.finally(() => {
      delete this.promiseRecord[id];
    });

    if (forget) {
      promise.catch(error => {
        kUtilsInjectables.logger().error(error);
      });
    }
  }
}

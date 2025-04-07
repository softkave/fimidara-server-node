import {AnyFn} from 'softkave-js-utils';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {appAssert} from './assertion.js';

export async function waitOnPromisesAndLogErrors(promises: Promise<unknown>[]) {
  (await Promise.allSettled(promises)).forEach(
    result =>
      result.status === 'rejected' && kIjxUtils.logger().error(result.reason)
  );
}

/** Expects that you handle `catch()` and stragling promises (cases where it
 * times out) on your own */
export async function awaitOrTimeout<
  TPromise extends Promise<unknown>,
  TResult = TPromise extends Promise<infer Value> ? Value : unknown,
>(promise: TPromise, timeoutMs: number) {
  return new Promise<{timedout: true} | {timedout: false; result: TResult}>(
    resolve => {
      const timeoutHandle = setTimeout(() => {
        resolve({timedout: true});
      }, timeoutMs);

      promise.then(result => {
        clearTimeout(timeoutHandle);
        resolve({timedout: false, result: result as unknown as TResult});
      });
    }
  );
}

export interface DeferredPromise<T = void> {
  promise: Promise<T>;
  resolve: AnyFn<[T]>;
  reject: AnyFn<[unknown]>;
}

export function getDeferredPromise<T = void>(): DeferredPromise<T> {
  let promiseResolveFn: AnyFn<[T | PromiseLike<T>]> | undefined;
  let promiseRejectFn: AnyFn | undefined;

  const promise = new Promise<T>((resolve, reject) => {
    promiseResolveFn = resolve;
    promiseRejectFn = reject;
  });

  const resolveFn = (value: T) => {
    appAssert(promiseResolveFn, 'No promise resolve function');
    promiseResolveFn(value);
  };

  const rejectFn = (error?: unknown) => {
    appAssert(promiseRejectFn, 'No promise reject function');
    promiseRejectFn(error);
  };

  return {promise, resolve: resolveFn, reject: rejectFn};
}

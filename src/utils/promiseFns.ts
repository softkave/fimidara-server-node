import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {appAssert} from './assertion';
import {TimeoutError} from './errors';
import {AnyFn} from './types';

export async function waitOnPromisesAndLogErrors(promises: Promise<unknown>[]) {
  (await Promise.allSettled(promises)).forEach(
    result =>
      result.status === 'rejected' && kUtilsInjectables.logger().error(result.reason)
  );
}

export async function awaitOrTimeout(promise: Promise<unknown>, timeoutMs: number) {
  const timeoutHandle = setTimeout(() => {
    throw new TimeoutError();
  }, timeoutMs);

  try {
    return await promise;
  } finally {
    clearTimeout(timeoutHandle);
  }
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
    appAssert(promiseResolveFn);
    promiseResolveFn(value);
  };

  const rejectFn = (error?: unknown) => {
    appAssert(promiseRejectFn);
    promiseRejectFn(error);
  };

  return {promise, resolve: resolveFn, reject: rejectFn};
}

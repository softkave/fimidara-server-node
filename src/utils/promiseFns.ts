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

export function getDeferredPromise<T = void>() {
  let internalResolvePromise: AnyFn<[T | PromiseLike<T>]> | undefined;
  let internalRejectPromise: AnyFn | undefined;

  const promise = new Promise<T>((resolve, reject) => {
    internalResolvePromise = resolve;
    internalRejectPromise = reject;
  });

  const resolveFn = (value: T) => {
    appAssert(internalResolvePromise);
    internalResolvePromise(value);
  };

  const rejectFn = (error?: unknown) => {
    appAssert(internalRejectPromise);
    internalRejectPromise(error);
  };

  return {promise, resolve: resolveFn, reject: rejectFn};
}

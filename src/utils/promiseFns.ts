import {TimeoutError} from './errors';
import {serverLogger} from './logger/loggerUtils';

export async function waitOnPromisesAndLogErrors(promises: Promise<unknown>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && serverLogger.error(result.reason)
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

import {logger} from './logger/logger';

export const fireAndForgetFn = async <Fn extends (...args: any) => any>(
  fn: Fn,
  ...args: Array<Parameters<Fn>>
): Promise<ReturnType<Fn> | undefined> => {
  try {
    return await fn(...args);
  } catch (error) {
    logger.error(error);
  }

  return undefined;
};

export const fireAndForgetPromise = async <T>(promise: Promise<T>) => {
  try {
    return await promise;
  } catch (error) {
    logger.error(error);
  }

  return undefined;
};

export async function waitOnPromisesAndLogErrors(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && logger.error(result.reason)
  );
}

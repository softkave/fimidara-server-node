import {logger} from './logger/logger';

export async function waitOnPromisesAndLogErrors(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && logger.error(result.reason)
  );
}

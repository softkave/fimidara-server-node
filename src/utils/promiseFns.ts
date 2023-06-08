import {serverLogger} from './logger/loggerUtils';

export async function waitOnPromisesAndLogErrors(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && serverLogger.error(result.reason)
  );
}

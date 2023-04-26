import {getLogger} from '../endpoints/globalUtils';

export async function waitOnPromisesAndLogErrors(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && getLogger().error(result.reason)
  );
}

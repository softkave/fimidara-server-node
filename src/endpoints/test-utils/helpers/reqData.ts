import {
  throwRejectedPromisesWithId,
  waitOnPromisesWithId,
} from '../../../utilities/waitOnPromises';
import RequestData from '../../RequestData';

export async function waitForRequestPendingJobs(reqData: RequestData) {
  throwRejectedPromisesWithId(
    await waitOnPromisesWithId(reqData.pendingPromises)
  );
}

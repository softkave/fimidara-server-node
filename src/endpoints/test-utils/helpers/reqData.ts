import {
  throwRejectedPromisesWithId,
  waitOnPromisesWithId,
} from '../../../utilities/waitOnPromises';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';

export async function waitForRequestPendingJobs(
  ctx: IBaseContext,
  reqData: RequestData
) {
  throwRejectedPromisesWithId(
    ctx,
    await waitOnPromisesWithId(reqData.pendingPromises)
  );
}

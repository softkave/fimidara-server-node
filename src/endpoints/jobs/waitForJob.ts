import {isNumber} from 'lodash';
import {kJobStatus} from '../../definitions/job';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {TimeoutError} from '../../utils/errors';
import {kSemanticModels} from '../contexts/injection/injectables';

/** Waits for job and children to complete. Use extremely sparingly, and
 * primarily for testing. */
export async function waitForJob(
  jobId: string,
  bumpPriority: boolean | number = true,
  timeoutMs = /** 5 mins */ 5 * 60 * 1000,
  pollIntervalMs = 100 // 100ms
) {
  const startMs = getTimestamp();

  if (bumpPriority) {
    await kSemanticModels.utils().withTxn(async opts => {
      const sampleJob = await kSemanticModels.job().getOneById(jobId, opts);
      appAssert(sampleJob);
      await kSemanticModels.job().updateManyByQuery(
        {
          $or: [
            // Bump children priority
            {parents: jobId},
            // Bump job priority
            {resourceId: jobId},
          ],
        },
        {
          priority: isNumber(bumpPriority)
            ? bumpPriority
            : Math.min(sampleJob.priority * 2, Number.MAX_SAFE_INTEGER),
        },
        opts
      );
    });
  }

  return new Promise<void>((resolve, reject) => {
    const waitFn = async () => {
      const job = await kSemanticModels.job().getOneByQuery({resourceId: jobId});

      if (
        !job ||
        job.status === kJobStatus.completed ||
        job.status === kJobStatus.failed
      ) {
        resolve();
        return;
      }

      if (getTimestamp() < startMs + timeoutMs) {
        setTimeout(waitFn, pollIntervalMs);
      } else {
        reject(new TimeoutError());
      }
    };

    waitFn();
  });
}

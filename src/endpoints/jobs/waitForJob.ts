import {isNumber} from 'lodash-es';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {kJobStatus} from '../../definitions/job.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {TimeoutError} from '../../utils/errors.js';

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
    await kIjxSemantic.utils().withTxn(async opts => {
      const sampleJob = await kIjxSemantic.job().getOneById(jobId, opts);
      appAssert(sampleJob, `Job with ID ${jobId} not found`);
      await kIjxSemantic.job().updateManyByQuery(
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
      const job = await kIjxSemantic.job().getOneByQuery({resourceId: jobId});

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

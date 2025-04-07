import assert from 'assert';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  EmailJobParams,
  INewSignupsOnWaitlistJobMeta,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {queueJobs} from '../queueJobs.js';
import {setJobMeta02} from './utils.js';

export async function runNewSignupsOnWaitlistJob(job: Job) {
  assert(
    job.type === kJobType.newSignupsOnWaitlist,
    `Invalid job type ${job.type}`
  );

  const startMs =
    (job.meta as INewSignupsOnWaitlistJobMeta | undefined)?.lastRunMs || 0;
  const endMs = Date.now();
  await setJobMeta02<INewSignupsOnWaitlistJobMeta>(job.resourceId, {
    lastRunMs: endMs,
  });

  const newSignupsCount = await kIjxSemantic
    .user()
    .countUsersCreatedBetween(startMs, endMs);

  if (newSignupsCount > 0) {
    const {rootUserEmail} = kIjxUtils.suppliedConfig();
    assert(rootUserEmail, 'rootUserEmail not present in config');

    await queueJobs<EmailJobParams>(
      /** workspace ID */ undefined,
      /** parent job ID */ undefined,
      {
        shard: job.shard,
        type: kJobType.email,
        createdBy: job.createdBy,
        idempotencyToken: Date.now().toString(),
        params: {
          userId: [],
          emailAddress: [rootUserEmail],
          type: kEmailJobType.newSignupsOnWaitlist,
          params: {count: newSignupsCount},
        },
      }
    );
  }
}

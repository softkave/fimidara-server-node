import assert from 'assert';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Job, kJobType} from '../../../definitions/job.js';

export async function runCleanupMountResolvedEntriesJob(
  job: Pick<Job, 'params' | 'type'>
) {
  assert(job.type === kJobType.cleanupMountResolvedEntries);

  await kIjxSemantic.utils().withTxn(async opts => {
    await kIjxSemantic
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}

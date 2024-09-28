import assert from 'assert';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {Job, kJobType} from '../../../definitions/job.js';

export async function runCleanupMountResolvedEntriesJob(
  job: Pick<Job, 'params' | 'type'>
) {
  assert(job.type === kJobType.cleanupMountResolvedEntries);

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}

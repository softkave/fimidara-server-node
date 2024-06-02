import {Job} from '../../../definitions/job.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';

export async function runCleanupMountResolvedEntriesJob(
  job: Pick<Job, 'params'>
) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}

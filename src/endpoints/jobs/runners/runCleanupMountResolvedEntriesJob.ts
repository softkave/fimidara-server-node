import {CleanupMountResolvedEntriesJobParams, Job} from '../../../definitions/job';
import {kSemanticModels} from '../../contexts/injectables';

export async function runCleanupMountResolvedEntriesJob(
  job: Pick<Job<CleanupMountResolvedEntriesJobParams>, 'params'>
) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}

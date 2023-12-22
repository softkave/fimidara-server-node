import {CleanupMountResolvedEntriesJobParams, Job} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injectables';

export async function runCleanupMountResolvedEntriesJob(
  job: Job<CleanupMountResolvedEntriesJobParams>
) {
  appAssert(job.workspaceId);
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  });
}

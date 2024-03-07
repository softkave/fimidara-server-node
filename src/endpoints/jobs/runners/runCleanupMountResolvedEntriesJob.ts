import {Job} from '../../../definitions/job';
import {kSemanticModels} from '../../contexts/injection/injectables';

export async function runCleanupMountResolvedEntriesJob(job: Pick<Job, 'params'>) {
  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels
      .resolvedMountEntry()
      .deleteManyByQuery({mountId: job.params.mountId}, opts);
  }, /** reuseTxn */ true);
}

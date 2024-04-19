import {
  DeleteResourceJobParams,
  Job,
  kJobStatus,
  kJobType,
} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {getNewIdForResource} from '../../../../utils/resource';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {queueJobs} from '../../queueJobs';

export async function runDeleteResourceJob0(job: Job) {
  const deleteArtifactsJobId = getNewIdForResource(kFimidaraResourceType.Job);
  await kSemanticModels.utils().withTxn(async () => {
    // queueJobs should use current context's txn, so both should fail if one
    // fails
    await Promise.all([
      queueJobs<DeleteResourceJobParams>(
        job.workspaceId,
        job.resourceId,
        {
          createdBy: job.createdBy,
          type: kJobType.deleteResourceArtifacts,
          shard: job.shard,
          priority: job.priority,
          params: job.params as DeleteResourceJobParams,
          idempotencyToken: Date.now().toString(),
        },
        {seed: {resourceId: deleteArtifactsJobId}, reuseTxn: true}
      ),
      queueJobs<DeleteResourceJobParams>(job.workspaceId, job.resourceId, {
        createdBy: job.createdBy,
        type: kJobType.deleteResourceSelf,
        shard: job.shard,
        priority: job.priority,
        params: job.params as DeleteResourceJobParams,
        runAfter: {jobId: deleteArtifactsJobId, status: [kJobStatus.completed]},
        idempotencyToken: Date.now().toString(),
      }),
    ]);
  }, /** reuseTxn */ true);
}

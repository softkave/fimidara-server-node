import {
  Job,
  DeleteResourceJobParams,
  kJobType,
  kJobStatus,
} from '../../../../definitions/job';
import {kAppResourceType} from '../../../../definitions/system';
import {getNewIdForResource} from '../../../../utils/resource';
import {kSemanticModels} from '../../../contexts/injection/injectables';
import {queueJobs} from '../../queueJobs';

export async function runDeleteResourceJob0(job: Job) {
  const deleteArtifactsJobId = getNewIdForResource(kAppResourceType.Job);
  await kSemanticModels.utils().withTxn(async () => {
    // queueJobs should use current context's txn, so both should fail if one
    // fails
    await Promise.all([
      queueJobs<DeleteResourceJobParams>(
        job.workspaceId,
        job.resourceId,
        {
          type: kJobType.deleteResourceArtifacts,
          shard: job.shard,
          priority: job.priority,
          params: job.params as DeleteResourceJobParams,
        },
        {seed: {resourceId: deleteArtifactsJobId}}
      ),
      queueJobs<DeleteResourceJobParams>(job.workspaceId, job.resourceId, {
        type: kJobType.deleteResourceSelf,
        shard: job.shard,
        priority: job.priority,
        params: job.params as DeleteResourceJobParams,
        runAfter: {jobId: deleteArtifactsJobId, status: [kJobStatus.completed]},
      }),
    ]);
  });
}

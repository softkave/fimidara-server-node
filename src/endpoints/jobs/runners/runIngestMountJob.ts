import {kFileBackendType} from '../../../definitions/fileBackend';
import {IngestFolderpathJobParams, Job, kJobType} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {JobInput, queueJobs} from '../queueJobs';

export async function runIngestMountJob(job: Job) {
  appAssert(job.workspaceId, 'workspaceId not present in job');
  const mount = await kSemanticModels.fileBackendMount().getOneById(job.params.mountId);

  if (!mount || mount.backend === kFileBackendType.fimidara) {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    createdBy: job.createdBy,
    type: kJobType.ingestFolderpath,
    params: {ingestFrom: mount.mountedFrom, mountId: mount.resourceId},
    idempotencyToken: Date.now().toString(),
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}

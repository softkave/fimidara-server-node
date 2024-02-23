import {kFileBackendType} from '../../../definitions/fileBackend';
import {
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
  kJobType,
} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {JobInput, queueJobs} from '../queueJobs';

export async function runIngestMountJob(job: Job<IngestMountJobParams>) {
  appAssert(job.workspaceId);
  const mount = await kSemanticModels.fileBackendMount().getOneById(job.params.mountId);

  if (!mount || mount.backend === kFileBackendType.fimidara) {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    createdBy: job.createdBy,
    type: kJobType.ingestFolderpath,
    params: {
      ingestFrom: mount.mountedFrom,
      mountId: mount.resourceId,
      agentId: job.params.agentId,
    },
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}

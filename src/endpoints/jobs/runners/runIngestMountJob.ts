import {kFileBackendType} from '../../../definitions/fileBackend';
import {
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
  kJobType,
} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {kFolderConstants} from '../../folders/constants';
import {JobInput, queueJobs} from '../utils';

export async function runIngestMountJob(job: Job<IngestMountJobParams>) {
  appAssert(job.workspaceId);
  const mount = await kSemanticModels.fileBackendMount().getOneById(job.params.mountId);

  if (!mount || mount.backend === kFileBackendType.Fimidara) {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    type: kJobType.ingestFolderpath,
    params: {
      ingestFrom: mount.mountedFrom.join(kFolderConstants.separator),
      mountId: mount.resourceId,
      agentId: job.params.agentId,
    },
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}

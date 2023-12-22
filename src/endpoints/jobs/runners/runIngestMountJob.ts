import {
  Job,
  IngestMountJobParams,
  IngestFolderpathJobParams,
} from '../../../definitions/job';
import {appAssert} from '../../../utils/assertion';
import {kSemanticModels} from '../../contexts/injectables';
import {kFolderConstants} from '../../folders/constants';
import {JobInput, queueJobs} from '../utils';

export async function runIngestMountJob(job: Job<IngestMountJobParams>) {
  appAssert(job.workspaceId);
  const mount = await kSemanticModels.fileBackendMount().getOneById(job.params.mountId);

  if (!mount || mount.backend === 'fimidara') {
    return;
  }

  const input: JobInput<IngestFolderpathJobParams> = {
    type: 'ingestFolderpath',
    params: {
      folderpath: mount.folderpath.join(kFolderConstants.separator),
      mountId: mount.resourceId,
      agentId: job.params.agentId,
    },
  };

  await queueJobs(job.workspaceId, job.resourceId, [input]);
}

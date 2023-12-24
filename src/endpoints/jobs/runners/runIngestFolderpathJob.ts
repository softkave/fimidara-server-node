import {FileBackendMount} from '../../../definitions/fileBackend';
import {Folder} from '../../../definitions/folder';
import {IngestFolderpathJobParams, Job, kJobType} from '../../../definitions/job';
import {Agent} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {FilePersistenceProvider} from '../../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils';
import {
  ingestPersistedFiles,
  ingestPersistedFolders,
} from '../../fileBackends/ingestionUtils';
import {initBackendProvidersForMounts} from '../../fileBackends/mountUtils';
import {kFolderConstants} from '../../folders/constants';
import {JobInput, queueJobs} from '../utils';

async function ingestFolderpathJobFolders(
  agent: Agent,
  job: Job<IngestFolderpathJobParams>,
  folder: Folder | null,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const folderpath =
    job.params.folderpath ?? folder?.namepath.join(kFolderConstants.separator);
  appAssert(folderpath);

  do {
    const result = await provider.describeFolderFolders({
      folderpath,
      max: 1000,
      mount,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    await ingestPersistedFolders(agent, workspace, result.folders);

    kUtilsInjectables.promiseStore().forget(
      queueJobs(
        job.workspaceId,
        job.resourceId,
        result.folders.map((mountFolder): JobInput<IngestFolderpathJobParams> => {
          const jobParams: IngestFolderpathJobParams = {
            folderpath: mountFolder.folderpath,
            mountId: mountFolder.mountId,
            agentId: job.params.agentId,
          };
          return {
            type: kJobType.ingestFolderpath,
            params: jobParams,
            priority: job.priority,
            shard: job.shard,
          };
        })
      )
    );
  } while (continuationToken);
}

async function ingestFolderpathJobFiles(
  agent: Agent,
  job: Job<IngestFolderpathJobParams>,
  folder: Folder | null,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const folderpath =
    job.params.folderpath ?? folder?.namepath.join(kFolderConstants.separator);
  appAssert(folderpath);

  do {
    const result = await provider.describeFolderFiles({
      folderpath,
      max: 1000,
      mount,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    await ingestPersistedFiles(agent, workspace, result.files);
  } while (continuationToken);
}

export async function runIngestFolderpathJob(job: Job<IngestFolderpathJobParams>) {
  appAssert(job.workspaceId);

  const [mount, agent, folder] = await Promise.all([
    kSemanticModels.fileBackendMount().getOneById(job.params.mountId),
    kUtilsInjectables.session().getAgentById(job.params.agentId),
    job.params.folderId ? kSemanticModels.folder().getOneById(job.params.folderId) : null,
  ]);

  if (!mount || mount.backend === 'fimidara') {
    return;
  }

  const configs = await getBackendConfigsWithIdList(
    [mount.resourceId],
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];

  await Promise.all([
    ingestFolderpathJobFolders(agent, job, folder, mount, provider),
    ingestFolderpathJobFiles(agent, job, folder, mount, provider),
  ]);
}

import {FileBackendMount} from '../../../definitions/fileBackend';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../definitions/job';
import {Agent} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {AnyObject} from '../../../utils/types';
import {FilePersistenceProvider} from '../../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils';
import {
  ingestPersistedFiles,
  ingestPersistedFolders,
} from '../../fileBackends/ingestionUtils';
import {initBackendProvidersForMounts} from '../../fileBackends/mountUtils';
import {JobInput, queueJobs} from '../utils';

async function setContinuationTokenInJob(
  job: Job,
  continuationTokens: Pick<
    IngestFolderpathJobMeta,
    'getFilesContinuationToken' | 'getFoldersContinuationToken'
  >
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const latestJob: Pick<Job<AnyObject, IngestFolderpathJobMeta>, 'meta'> | null =
      await kSemanticModels
        .job()
        .getOneById(job.resourceId, {...opts, projection: {meta: true}});

    if (latestJob) {
      latestJob.meta = {...latestJob.meta, ...continuationTokens};

      // TODO: implement a way to update specific fields without overwriting
      // existing data, and without needing to get data from DB like we're
      // doing here
      kSemanticModels
        .job()
        .updateOneById<Job<AnyObject, IngestFolderpathJobMeta>>(
          job.resourceId,
          {meta: latestJob.meta},
          opts
        );
    }

    return latestJob;
  }, /** reuse txn from async local store */ false);
}

async function ingestFolderpathJobFolders(
  agent: Agent,
  job: Job<IngestFolderpathJobParams>,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const ingestFrom = job.params.ingestFrom;

  do {
    const result = await provider.describeFolderFolders({
      mount,
      folderpath: ingestFrom,
      max: 1000,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    kUtilsInjectables
      .promiseStore()
      .forget(
        setContinuationTokenInJob(job, {getFoldersContinuationToken: continuationToken})
      );
    await ingestPersistedFolders(agent, workspace, result.folders);

    kUtilsInjectables.promiseStore().forget(
      queueJobs(
        job.workspaceId,
        job.resourceId,
        result.folders.map((mountFolder): JobInput<IngestFolderpathJobParams> => {
          const jobParams: IngestFolderpathJobParams = {
            ingestFrom: mountFolder.folderpath,
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
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let continuationToken: unknown | undefined = undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const ingestFrom = job.params.ingestFrom;

  do {
    const result = await provider.describeFolderFiles({
      mount,
      folderpath: ingestFrom,
      max: 1000,
      workspaceId: mount.workspaceId,
      continuationToken,
    });

    continuationToken = result.continuationToken;
    kUtilsInjectables
      .promiseStore()
      .forget(
        setContinuationTokenInJob(job, {getFilesContinuationToken: continuationToken})
      );
    await ingestPersistedFiles(agent, workspace, result.files);
  } while (continuationToken);
}

export async function runIngestFolderpathJob(job: Job<IngestFolderpathJobParams>) {
  appAssert(job.workspaceId);

  const [mount, agent] = await Promise.all([
    kSemanticModels.fileBackendMount().getOneById(job.params.mountId),
    kUtilsInjectables.session().getAgentById(job.params.agentId),
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
    ingestFolderpathJobFolders(agent, job, mount, provider),
    ingestFolderpathJobFiles(agent, job, mount, provider),
  ]);
}

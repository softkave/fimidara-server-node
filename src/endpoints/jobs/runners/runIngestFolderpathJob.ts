import {compact} from 'lodash';
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
import {
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceProvider,
} from '../../contexts/file/types';
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
  continuationTokens: Pick<IngestFolderpathJobMeta, 'getContentContinuationToken'>
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
  let result: FilePersistenceDescribeFolderContentResult | undefined;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const ingestFrom = job.params.ingestFrom;

  do {
    result = await provider.describeFolderContent({
      mount,
      folderpath: ingestFrom,
      max: 1000,
      workspaceId: mount.workspaceId,
      continuationToken: result?.continuationToken,
    });
    kUtilsInjectables.promises().forget(
      setContinuationTokenInJob(job, {
        getContentContinuationToken: result.continuationToken,
      })
    );
    await Promise.all([
      ingestPersistedFolders(agent, workspace, result.folders),
      ingestPersistedFiles(agent, workspace, result.files),
    ]);
    kUtilsInjectables.promises().forget(
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
  } while (result.continuationToken && (result.folders.length || result.files.length));
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
    compact([mount.configId]),
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];
  await ingestFolderpathJobFolders(agent, job, mount, provider);
}

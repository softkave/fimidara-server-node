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
import {pathJoin, pathSplit} from '../../../utils/fns';
import {AnyObject} from '../../../utils/types';
import {
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceProvider,
  PersistedFolderDescription,
} from '../../contexts/file/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils';
import {
  ingestPersistedFiles,
  ingestPersistedFolders,
} from '../../fileBackends/ingestionUtils';
import {initBackendProvidersForMounts} from '../../fileBackends/mountUtils';
import {JobInput, queueJobs} from '../queueJobs';

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
      const update: Partial<Job<AnyObject, IngestFolderpathJobMeta>> = {
        meta: latestJob.meta,
      };

      // TODO: implement a way to update specific fields without overwriting
      // existing data, and without needing to get data from DB like we're
      // doing here
      await kSemanticModels.job().updateOneById(job.resourceId, update, opts);
    }

    return latestJob;
  }, /** reuse txn from async local store */ false);
}

async function queueIngestFolderJobFor(
  parentJob: Job,
  folders: PersistedFolderDescription[]
) {
  await queueJobs(
    parentJob.workspaceId,
    parentJob.resourceId,
    folders.map((mountFolder): JobInput<IngestFolderpathJobParams> => {
      const jobParams: IngestFolderpathJobParams = {
        ingestFrom: pathSplit(mountFolder.folderpath),
        mountId: mountFolder.mountId,
        agentId: parentJob.params.agentId,
      };

      return {
        createdBy: parentJob.createdBy,
        type: kJobType.ingestFolderpath,
        params: jobParams,
        priority: parentJob.priority,
        shard: parentJob.shard,
      };
    })
  );
}

async function ingestFolderpathContents(
  agent: Agent,
  job: Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId);
  let result: FilePersistenceDescribeFolderContentResult | undefined;
  let continuationToken = job.meta?.getContentContinuationToken;
  const workspace = await kSemanticModels.workspace().getOneById(job.workspaceId);
  appAssert(workspace);

  const ingestFrom = job.params.ingestFrom;

  do {
    result = await provider.describeFolderContent({
      mount,
      continuationToken,
      folderpath: pathJoin(ingestFrom),
      max: 1000,
      workspaceId: mount.workspaceId,
    });
    continuationToken = result.continuationToken;
    kUtilsInjectables.promises().forget(
      setContinuationTokenInJob(job, {
        getContentContinuationToken: result.continuationToken,
      })
    );
    await Promise.all([
      ingestPersistedFolders(agent, workspace, result.folders),
      ingestPersistedFiles(agent, workspace, result.files),
    ]);
    kUtilsInjectables.promises().forget(queueIngestFolderJobFor(job, result.folders));
  } while (continuationToken && (result.folders.length || result.files.length));
}

export async function runIngestFolderpathJob(job: Job) {
  appAssert(job.workspaceId);

  const [mount, agent, job_] = await Promise.all([
    kSemanticModels.fileBackendMount().getOneById(job.params.mountId),
    kUtilsInjectables.session().getAgentById(job.params.agentId),
    // Refetch job so as to use latest continuation token set in meta
    kSemanticModels.job().getOneById(job.resourceId),
  ]);

  if (job_) {
    job = job_ as Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>;
  }

  if (!mount || mount.backend === 'fimidara') {
    return;
  }

  const configs = await getBackendConfigsWithIdList(
    compact([mount.configId]),
    /** throw error is config is not found */ true
  );
  const providersMap = await initBackendProvidersForMounts([mount], configs);
  const provider = providersMap[mount.resourceId];

  if (provider) {
    await ingestFolderpathContents(
      agent,
      job as Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>,
      mount,
      provider
    );
  }
}

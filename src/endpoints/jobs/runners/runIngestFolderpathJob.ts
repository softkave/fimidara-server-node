import assert from 'assert';
import {compact} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceProvider,
  PersistedFolderDescription,
} from '../../../contexts/file/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {FileBackendMount} from '../../../definitions/fileBackend.js';
import {
  IngestFolderpathJobMeta,
  IngestFolderpathJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {SessionAgent} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {pathJoin, pathSplit} from '../../../utils/fns.js';
import {getBackendConfigsWithIdList} from '../../fileBackends/configUtils.js';
import {
  ingestPersistedFiles,
  ingestPersistedFolders,
} from '../../fileBackends/ingestionUtils.js';
import {initBackendProvidersForMounts} from '../../fileBackends/mountUtils.js';
import {JobInput, queueJobs} from '../queueJobs.js';

async function setContinuationTokenInJob(
  job: Job,
  continuationTokens: Pick<
    IngestFolderpathJobMeta,
    'getContentContinuationToken'
  >
) {
  return await kIjxSemantic.utils().withTxn(async opts => {
    const latestJob: Pick<
      Job<AnyObject, IngestFolderpathJobMeta>,
      'meta'
    > | null = await kIjxSemantic
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
      await kIjxSemantic.job().updateOneById(job.resourceId, update, opts);
    }

    return latestJob;
  });
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
      };

      return {
        createdBy: parentJob.createdBy,
        type: kJobType.ingestFolderpath,
        params: jobParams,
        priority: parentJob.priority,
        shard: parentJob.shard,
        idempotencyToken: Date.now().toString(),
      };
    })
  );
}

async function ingestFolderpathContents(
  agent: SessionAgent,
  job: Job<IngestFolderpathJobParams, IngestFolderpathJobMeta>,
  mount: FileBackendMount,
  provider: FilePersistenceProvider
) {
  appAssert(job.workspaceId, 'workspaceId not present in job');

  let result: FilePersistenceDescribeFolderContentResult<any, any> | undefined;
  let continuationToken = job.meta?.getContentContinuationToken;
  const workspace = await kIjxSemantic.workspace().getOneById(job.workspaceId);
  appAssert(workspace, 'Workspace not found for job');

  const ingestFrom = job.params.ingestFrom;

  do {
    result = await provider.describeFolderContent({
      mount,
      continuationToken,
      folderpath: pathJoin(ingestFrom),
      max: 1000,
      workspaceId: mount.workspaceId,
    });
    continuationToken = result?.continuationToken;
    kIjxUtils.promises().callAndForget(() =>
      setContinuationTokenInJob(job, {
        getContentContinuationToken: result?.continuationToken,
      })
    );
    await Promise.all([
      ingestPersistedFolders(agent, workspace, result.folders),
      ingestPersistedFiles(agent, workspace, result.files),
    ]);
    kIjxUtils
      .promises()
      .callAndForget(() => queueIngestFolderJobFor(job, result?.folders ?? []));
  } while (
    continuationToken &&
    (result?.folders.length || result?.files.length)
  );
}

export async function runIngestFolderpathJob(job: Job) {
  assert(job.type === kJobType.ingestFolderpath);
  appAssert(job.workspaceId, 'workspaceId not present in job');
  appAssert(job.createdBy, 'agent not present in job');

  const [mount, agent, job_] = await Promise.all([
    kIjxSemantic.fileBackendMount().getOneById(job.params.mountId),
    kIjxUtils.session().getAgentByAgentTokenId(job.createdBy.agentTokenId),
    // Refetch job so as to use latest continuation token set in meta
    kIjxSemantic.job().getOneById(job.resourceId),
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

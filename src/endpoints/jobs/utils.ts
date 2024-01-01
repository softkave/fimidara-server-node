import {defaultTo, first, isObject, keyBy, noop} from 'lodash';
import {AnyObject} from 'mongoose';
import {availableParallelism} from 'os';
import {App, AppShard, kAppPresetShards, kAppType} from '../../definitions/app';
import {
  CleanupMountResolvedEntriesJobParams,
  DeleteResourceJobParams,
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
  JobStatus,
  JobStatusHistory,
  JobType,
  kJobPresetPriority,
  kJobRunnerV1,
  kJobStatus,
  kJobType,
} from '../../definitions/job';
import {kAppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {TimeoutError} from '../../utils/errors';
import {newResource} from '../../utils/resource';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../contexts/semantic/types';
import {runCleanupMountResolvedEntriesJob} from './runners/runCleanupMountResolvedEntriesJob';
import {runDeleteResourceJob} from './runners/runDeleteResourceJob';
import {runIngestFolderpathJob} from './runners/runIngestFolderpathJob';
import {runIngestMountJob} from './runners/runIngestMountJob';
import {
  BaseRunnerMessage,
  ChildRunnerWorkerData,
  RunnerWorkerMessage,
  kRunnerWorkerMessageTypeList,
} from './types';

export const kDefaultHeartbeatInterval = 5 * 60 * 1000; // 5 minutes
export const kDefaultActiveRunnerHeartbeatFactor = 2;
export const kDefaultRunnerCount = availableParallelism();
export const kEnsureRunnerCountPromiseName = 'runner_ensureRunnerCount';

export interface JobInput<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
> {
  type: JobType | (string & {});
  params: TParams;
  meta?: TMeta;
  idempotencyToken?: string;
  priority?: number;
  shard?: AppShard;
}

export async function queueJobs<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
>(
  workspaceId: string | undefined,
  parentJobId: string | undefined,
  jobsInput: JobInput<TParams, TMeta>[]
): Promise<Array<Job<TParams, TMeta>>> {
  if (jobsInput.length === 0) {
    return [];
  }

  const parentJob = parentJobId
    ? await kSemanticModels.job().getOneById(parentJobId)
    : undefined;
  const parents = defaultTo(parentJob?.parents, []).concat(parentJobId ?? []);
  const idempotencyTokens: string[] = [];
  const newJobs = jobsInput.map(input => {
    const idempotencyToken =
      input.idempotencyToken || JSON.stringify(input.params) + (parentJobId || '');
    const status: JobStatusHistory = {
      status: kJobStatus.pending,
      statusLastUpdatedAt: getTimestamp(),
    };

    idempotencyTokens.push(idempotencyToken);
    return newResource<Job>(kAppResourceType.Job, {
      workspaceId,
      parentJobId,
      idempotencyToken,
      parents,
      params: input.params,
      meta: input.meta,
      type: input.type,
      minRunnerVersion: kJobRunnerV1,
      statusHistory: [status],
      priority: input.priority ?? kJobPresetPriority.p1,
      shard: input.shard ?? kAppPresetShards.fimidaraMain,
      ...status,
    });
  });

  return await kSemanticModels.utils().withTxn(async opts => {
    const existingJobs = await kSemanticModels
      .job()
      .getManyByQuery({idempotencyToken: {$in: idempotencyTokens}}, opts);
    const existingJobsByIdempotencyToken = keyBy(
      existingJobs,
      job => job.idempotencyToken
    );

    const uniqueJobs = newJobs.filter(
      job => !existingJobsByIdempotencyToken[job.idempotencyToken]
    );
    await kSemanticModels.job().insertItem(uniqueJobs, opts);

    return uniqueJobs as Array<Job<TParams, TMeta>>;
  });
}

// TODO: wait for parents
// TODO: merge (settle kind) with existing

export async function completeJob(
  jobId: string,
  status: JobStatus = kJobStatus.completed
) {
  const job = await kSemanticModels.utils().withTxn(async opts => {
    const jobsModel = kSemanticModels.job();
    const [job, hasPendingChild, hasFailedChild] = await Promise.all([
      jobsModel.getOneById(jobId, opts),
      jobsModel.existsByQuery(
        {
          parents: {$elemMatch: jobId},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: {$nin: [kJobStatus.completed, kJobStatus.failed] as any[]},
        },
        opts
      ),
      jobsModel.existsByQuery(
        {
          parents: {$elemMatch: jobId},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          status: {$eq: kJobStatus.failed},
        },
        opts
      ),
    ]);

    if (!job) {
      return;
    }

    appAssert(job.runnerId);
    const statusItem: JobStatusHistory = {
      status: hasPendingChild
        ? kJobStatus.waitingForChildren
        : hasFailedChild
        ? kJobStatus.failed
        : status,
      statusLastUpdatedAt: getTimestamp(),
      runnerId: job.runnerId,
    };

    return await jobsModel.getAndUpdateOneById(
      jobId,
      {...statusItem, statusHistory: job.statusHistory.concat(statusItem)},
      opts
    );
  });

  if (
    job &&
    (job.status === kJobStatus.completed || job.status === kJobStatus.failed) &&
    job.parentJobId
  ) {
    kUtilsInjectables.promises().forget(completeJob(job.parentJobId));
  }

  return job;
}

export async function enqueueDeleteResourceJob(params: DeleteResourceJobParams) {
  const [job] = await queueJobs(params.args.workspaceId, undefined, [
    {params, type: kJobType.deleteResource},
  ]);

  return job;
}

export async function runJob(job: Job) {
  try {
    if (job.type === kJobType.deleteResource) {
      await runDeleteResourceJob(job);
    } else if (job.type === kJobType.ingestFolderpath) {
      await runIngestFolderpathJob(job as Job<IngestFolderpathJobParams>);
    } else if (job.type === kJobType.ingestMount) {
      await runIngestMountJob(job as Job<IngestMountJobParams>);
    } else if (job.type === kJobType.noop) {
      noop();
    } else if (job.type === kJobType.cleanupMountResolvedEntries) {
      await runCleanupMountResolvedEntriesJob(
        job as Job<CleanupMountResolvedEntriesJobParams>
      );
    } else if (job.type === kJobType.fail) {
      throw new Error('Fail job.');
    } else {
      console.log(`unknown job type ${job.type}`);
      return undefined;
    }

    return await completeJob(job.resourceId);
  } catch (error: unknown) {
    console.error(error);
    return await completeJob(job.resourceId, kJobStatus.failed);
  }
}

export async function markJobStarted(
  job: Job,
  runnerId: string | undefined,
  opts: SemanticProviderMutationRunOptions
) {
  const status: JobStatusHistory = {
    runnerId,
    status: kJobStatus.inProgress,
    statusLastUpdatedAt: getTimestamp(),
  };
  return await kSemanticModels
    .job()
    .getAndUpdateOneById(
      job.resourceId,
      {...status, statusHistory: job.statusHistory.concat(status)},
      opts
    );
}

export async function insertRunnerInDB(seed: Pick<App, 'resourceId'> & Partial<App>) {
  await kSemanticModels.utils().withTxn(opts =>
    kSemanticModels.app().insertItem(
      newResource<App>(kAppResourceType.App, {
        type: kAppType.runner,
        shard: kAppPresetShards.fimidaraMain,
        ...seed,
      }),
      opts
    )
  );
}

export function isBaseWorkerMessage(message: unknown): message is BaseRunnerMessage {
  return isObject(message);
}

export function isRunnerWorkerMessage(message: unknown): message is RunnerWorkerMessage {
  return (
    isBaseWorkerMessage(message) &&
    kRunnerWorkerMessageTypeList.includes((message as RunnerWorkerMessage).type)
  );
}

export function isChildRunnerWorkerData(data: unknown): data is ChildRunnerWorkerData {
  return isObject(data) && !!(data as ChildRunnerWorkerData).runnerId;
}

export async function getNextUnfinishedJob(
  activeRunnerIds: string[],
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderRunOptions
) {
  const jobs = await kDataModels.job().getManyByQuery(
    {
      status: kJobStatus.inProgress,
      // Avoid fetching in-progress jobs belonging to an active runner.
      runnerId: {$nin: activeRunnerIds},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shard: shards ? {$in: shards as any} : undefined,
    },
    {
      ...opts,
      // We only need 1 job, but we need to sort by priority, so we use getMany, with
      // size of 1.
      pageSize: 1,
      // Return jobs with highest priority first.
      sort: {priority: 'desc'},
    }
  );

  return first(jobs);
}

export async function getNextPendingJob(
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderRunOptions
) {
  const jobs = await kDataModels.job().getManyByQuery(
    {
      status: kJobStatus.pending,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shard: shards ? {$in: shards as any} : undefined,
    },
    {
      ...opts,
      // We only need 1 job, but we need to sort by priority, so we use getMany, with
      // size of 1.
      pageSize: 1,
      // Return jobs with highest priority first.
      sort: {priority: 'desc'},
    }
  );

  return first(jobs);
}

export async function getNextJob(
  activeRunnerIds: string[],
  runnerId: string,
  shards: Array<AppShard> | undefined
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const [unfinishedJob, pendingJob] = await Promise.all([
      getNextUnfinishedJob(activeRunnerIds, shards, opts),
      getNextPendingJob(shards, opts),
    ]);

    let selectedJob = unfinishedJob || pendingJob || null;

    if (selectedJob) {
      selectedJob = await markJobStarted(selectedJob, runnerId, opts);
    }

    return selectedJob;
  });
}

/** Waits for job and children to complete. Use extremely sparingly, and
 * primarily for testing. */
export async function waitForJob(
  jobId: string,
  bumpPriority = true,
  timeoutMs = /** 5 minutes */ 5 * 60 * 1000,
  pollIntervalMs = 100 // 100 milliseconds
) {
  const startMs = getTimestamp();

  if (bumpPriority) {
    await kSemanticModels.utils().withTxn(opts =>
      kSemanticModels.job().updateManyByQueryList(
        [
          // Bump children priority
          {parents: {$elemMatch: jobId}},
          // Bump job priority
          {resourceId: jobId},
        ],
        {priority: Number.MAX_SAFE_INTEGER},
        opts
      )
    );
  }

  return new Promise<void>((resolve, reject) => {
    const waitFn = async () => {
      const job = await kSemanticModels.job().getOneByQuery({resourceId: jobId});

      if (
        !job ||
        job.status === kJobStatus.completed ||
        job.status === kJobStatus.failed
      ) {
        resolve();
        return;
      }

      if (getTimestamp() > startMs + timeoutMs) {
        setTimeout(waitFn, pollIntervalMs);
      } else {
        reject(new TimeoutError());
      }
    };

    waitFn();
  });
}

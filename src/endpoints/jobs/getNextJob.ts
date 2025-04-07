import {first} from 'lodash-es';
import {DataQuery} from '../../contexts/data/types.js';
import {kIjxData, kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {AppShardId} from '../../definitions/app.js';
import {
  Job,
  JobStatusHistory,
  RunAfterJobItem,
  kJobStatus,
} from '../../definitions/job.js';
import {JobHistory} from '../../definitions/jobHistory.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {newResource} from '../../utils/resource.js';
import {AnyFn} from '../../utils/types.js';

export const kJobDefaultCooldownDuration = 5 * 60 * 1_000; // 5 minutes
let cooldownDuration = kJobDefaultCooldownDuration;

export function getJobCooldownDuration() {
  return cooldownDuration;
}

export function setJobCooldownDuration(duration: number) {
  appAssert(
    duration > 0,
    'Job cooldown duration must be greater than or equal to 0'
  );
  return (cooldownDuration = duration);
}

export async function markJobStarted(
  job: Job,
  runnerId: string | undefined,
  opts: SemanticProviderMutationParams
) {
  const status: JobStatusHistory = {
    runnerId,
    status: kJobStatus.inProgress,
    statusLastUpdatedAt: getTimestamp(),
  };
  const jobHistory: JobHistory = newResource(kFimidaraResourceType.jobHistory, {
    runnerId,
    jobId: job.resourceId,
    status: kJobStatus.inProgress,
  });

  const [updatedJob] = await Promise.all([
    kIjxSemantic.job().getAndUpdateOneById(job.resourceId, {...status}, opts),
    // TODO: should we fire-and-forget job history entries instead?
    kIjxSemantic.jobHistory().insertItem(jobHistory, opts),
  ]);

  return updatedJob;
}

export async function areJobRunConditionsSatisfied(
  job: Job,
  opts: SemanticProviderOpParams
) {
  if (!job.runAfter || job.runAfter.length === 0) {
    return true;
  }

  const runAfterByJobId = job.runAfter.reduce(
    (acc, condition) => {
      if (acc[condition.jobId]) {
        acc[condition.jobId].push(condition);
      } else {
        acc[condition.jobId] = [condition];
      }

      return acc;
    },
    {} as Record<string, RunAfterJobItem[]>
  );

  const runAfterJobIds = Object.keys(runAfterByJobId);
  const runAfterJobs = await kIjxSemantic
    .job()
    .getManyByIdList(runAfterJobIds, opts);
  return (
    runAfterJobs.length > 0 &&
    runAfterJobs.every(dependentJob => {
      const conditions = runAfterByJobId[dependentJob.resourceId];
      return conditions.every(condition =>
        condition.status.includes(dependentJob.status)
      );
    })
  );
}

async function getJobUsingFn(
  getJobFn: AnyFn<[], Promise<Job | undefined>>,
  opts: SemanticProviderOpParams
) {
  let job: Job | undefined;

  do {
    job = await getJobFn();
    const isReady = job && (await areJobRunConditionsSatisfied(job, opts));

    if (isReady) {
      return job;
    }
  } while (job);

  return undefined;
}

export async function getNextUnfinishedJob(
  activeRunnerIds: string[],
  shards: Array<AppShardId> | undefined,
  opts: SemanticProviderMutationParams
): Promise<Job | undefined> {
  const startMs = getTimestamp();
  return await getJobUsingFn(async () => {
    const query: DataQuery<Job> = {
      status: kJobStatus.inProgress,
      // Avoid fetching in-progress jobs belonging to an active runner.
      runnerId: {$nin: activeRunnerIds},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shard: shards ? {$in: shards as any} : undefined,
    };

    const jobs = await kIjxData.job().getManyByQuery(
      {
        $or: [
          {...query, cooldownTill: null},
          {...query, cooldownTill: {$lt: startMs}},
        ],
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

    const job = first(jobs);
    if (job) {
      // TODO: consolidate cooldown checking
      await kIjxData
        .job()
        .updateOneByQuery(
          {resourceId: job.resourceId},
          {cooldownTill: startMs + cooldownDuration},
          opts
        );
    }

    return job;
  }, opts);
}

export async function getNextPendingJob(
  shards: Array<AppShardId> | undefined,
  opts: SemanticProviderMutationParams
) {
  const startMs = getTimestamp();
  return await getJobUsingFn(async () => {
    const query: DataQuery<Job> = {
      status: kJobStatus.pending,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shard: shards ? {$in: shards as any} : undefined,
    };

    const jobs = await kIjxData.job().getManyByQuery(
      {
        $or: [
          {...query, cooldownTill: null},
          {...query, cooldownTill: {$lt: startMs}},
        ],
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

    const job = first(jobs);
    if (job) {
      // TODO: consolidate cooldown checking
      await kIjxData
        .job()
        .updateOneByQuery(
          {resourceId: job.resourceId},
          {cooldownTill: startMs + cooldownDuration},
          opts
        );
    }

    return job;
  }, opts);
}

export async function getNextJob(
  activeRunnerIds: string[],
  runnerId: string,
  shards: Array<AppShardId> | undefined
) {
  return await kIjxSemantic.utils().withTxn(async opts => {
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

import {first} from 'lodash';
import {AppShard} from '../../definitions/app';
import {Job, JobStatusHistory, RunAfterJobItem, kJobStatus} from '../../definitions/job';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {AnyFn} from '../../utils/types';
import {DataQuery} from '../contexts/data/types';
import {kDataModels, kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../contexts/semantic/types';

export const kJobDefaultCooldownDuration = 5 * 60 * 1_000; // 5 minutes
let cooldownDuration = kJobDefaultCooldownDuration;

export function getJobCooldownDuration() {
  return cooldownDuration;
}

export function setJobCooldownDuration(duration: number) {
  appAssert(duration > 0);
  return (cooldownDuration = duration);
}

export async function markJobStarted(
  job: Job,
  runnerId: string | undefined,
  opts: SemanticProviderMutationTxnOptions
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

export async function areJobRunConditionsSatisfied(
  job: Job,
  opts: SemanticProviderTxnOptions
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
  const runAfterJobs = await kSemanticModels.job().getManyByIdList(runAfterJobIds, opts);
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
  opts: SemanticProviderTxnOptions
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
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderMutationTxnOptions
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
    const jobs = await kDataModels.job().getManyByQuery(
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
      await kDataModels
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
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderMutationTxnOptions
) {
  const startMs = getTimestamp();
  return await getJobUsingFn(async () => {
    const query: DataQuery<Job> = {
      status: kJobStatus.pending,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shard: shards ? {$in: shards as any} : undefined,
    };
    const jobs = await kDataModels.job().getManyByQuery(
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
      await kDataModels
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
  }, /** reuseTxn */ false);
}

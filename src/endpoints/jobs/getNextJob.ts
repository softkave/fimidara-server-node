import {AppShard} from '../../definitions/app';
import {Job, JobStatusHistory, RunAfterJobItem, kJobStatus} from '../../definitions/job';
import {getTimestamp} from '../../utils/dateFns';
import {AnyFn} from '../../utils/types';
import {kDataModels, kSemanticModels} from '../contexts/injection/injectables';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../contexts/semantic/types';

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
  if (!job.runAfter) {
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
  return runAfterJobs.every(dependentJob => {
    const conditions = runAfterByJobId[dependentJob.resourceId];
    return conditions.every(condition => condition.status.includes(dependentJob.status));
  });
}

async function getJobUsingFn(
  fn: AnyFn<[], Promise<Job | undefined>>,
  opts: SemanticProviderTxnOptions
) {
  let job: Job | undefined;

  do {
    job = await fn();

    if (job && (await areJobRunConditionsSatisfied(job, opts))) {
      return job;
    }
  } while (job);

  return undefined;
}

export async function getNextUnfinishedJob(
  activeRunnerIds: string[],
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderTxnOptions
): Promise<Job | undefined> {
  return await getJobUsingFn(async () => {
    const [job] = await kDataModels.job().getManyByQuery(
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

    return job;
  }, opts);
}

export async function getNextPendingJob(
  shards: Array<AppShard> | undefined,
  opts: SemanticProviderTxnOptions
) {
  return await getJobUsingFn(async () => {
    const [job] = await kDataModels.job().getManyByQuery(
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
  });
}

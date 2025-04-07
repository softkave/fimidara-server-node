import {defaultTo, isArray, keyBy} from 'lodash-es';
import {AnyObject} from 'softkave-js-utils';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {AppShardId, kAppPresetShards} from '../../definitions/app.js';
import {
  Job,
  JobStatusHistory,
  JobType,
  RunAfterJobItem,
  kJobPresetPriority,
  kJobRunnerV1,
  kJobStatus,
} from '../../definitions/job.js';
import {JobHistory} from '../../definitions/jobHistory.js';
import {Agent, kFimidaraResourceType} from '../../definitions/system.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {convertToArray} from '../../utils/fns.js';
import {newResource} from '../../utils/resource.js';
import {
  getActionAgentFromSessionAgent,
  isSessionAgent,
} from '../../utils/sessionUtils.js';

export interface JobInput<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
> extends Pick<Job, 'runCategory' | 'cronInterval'> {
  type: JobType;
  params: TParams;
  meta?: TMeta;
  idempotencyToken: string | undefined;
  priority?: number;
  shard?: AppShardId;
  runAfter?: RunAfterJobItem | RunAfterJobItem[];
  createdBy: Agent;
}

export async function queueJobs<
  TParams extends AnyObject = AnyObject,
  TMeta extends AnyObject = AnyObject,
>(
  workspaceId: string | undefined,
  parentJobId: string | undefined,
  jobsInput: JobInput<TParams, TMeta> | Array<JobInput<TParams, TMeta>>,
  insertOptions: {
    jobsToReturn?: 'all' | 'new';
    seed?: Partial<Job<TParams, TMeta>>;
    opts?: SemanticProviderMutationParams;
  } = {}
): Promise<Array<Job<TParams, TMeta>>> {
  const {opts, jobsToReturn = 'all'} = insertOptions;
  if (!isArray(jobsInput)) {
    jobsInput = convertToArray(jobsInput);
  }

  if (jobsInput.length === 0) {
    return [];
  }

  const parentJob = parentJobId
    ? await kIjxSemantic.job().getOneById(parentJobId)
    : undefined;
  const parents = defaultTo(parentJob?.parents, []).concat(parentJobId ?? []);
  const idempotencyTokens: string[] = [];
  const newJobs = jobsInput.map(input => {
    const idempotencyToken =
      input.idempotencyToken ||
      JSON.stringify(input.params) + (parentJobId || '');
    const status: JobStatusHistory = {
      status: kJobStatus.pending,
      statusLastUpdatedAt: getTimestamp(),
    };

    idempotencyTokens.push(idempotencyToken);
    return newResource<Job<TParams, TMeta>>(kFimidaraResourceType.Job, {
      workspaceId,
      parentJobId,
      idempotencyToken,
      parents,
      params: input.params,
      meta: input.meta,
      type: input.type,
      minRunnerVersion: kJobRunnerV1,
      priority: input.priority ?? kJobPresetPriority.p1,
      shard: input.shard ?? kAppPresetShards.fimidaraMain,
      runAfter: input.runAfter ? convertToArray(input.runAfter) : undefined,
      createdBy: isSessionAgent(input.createdBy)
        ? getActionAgentFromSessionAgent(input.createdBy)
        : input.createdBy,
      ...status,
      ...insertOptions.seed,
    });
  });

  return await kIjxSemantic.utils().withTxn(async opts => {
    const existingJobs = await kIjxSemantic
      .job()
      .getManyByQuery({idempotencyToken: {$in: idempotencyTokens}}, opts);
    const existingJobsByIdempotencyToken = keyBy(
      existingJobs,
      job => job.idempotencyToken
    );

    const jobs: Array<Job> = [];
    const uniqueJobs: Array<Job> = [];
    newJobs.forEach(job => {
      const existingJob = existingJobsByIdempotencyToken[job.idempotencyToken];

      if (existingJob) {
        jobs.push(existingJob);
      } else {
        jobs.push(job);
        uniqueJobs.push(job);
      }
    });

    const jobHistories = uniqueJobs.map(newJob =>
      newResource<JobHistory>(kFimidaraResourceType.jobHistory, {
        status: newJob.status,
        jobId: newJob.resourceId,
        runnerId: newJob.runnerId,
      })
    );

    await Promise.all([
      kIjxSemantic.job().insertItem(uniqueJobs, opts),
      kIjxSemantic.jobHistory().insertItem(jobHistories, opts),
    ]);

    return (jobsToReturn === 'all' ? jobs : uniqueJobs) as Array<
      Job<TParams, TMeta>
    >;
  }, opts);
}

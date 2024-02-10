import {defaultTo, isArray, keyBy} from 'lodash';
import {AnyObject} from 'mongoose';
import {AppShard, kAppPresetShards} from '../../definitions/app';
import {
  DeleteResourceJobParams,
  Job,
  JobStatusHistory,
  JobType,
  RunAfterJobItem,
  kJobPresetPriority,
  kJobRunnerV1,
  kJobStatus,
  kJobType,
} from '../../definitions/job';
import {kAppResourceType} from '../../definitions/system';
import {getTimestamp} from '../../utils/dateFns';
import {toArray} from '../../utils/fns';
import {newResource} from '../../utils/resource';
import {kSemanticModels} from '../contexts/injection/injectables';

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
  runAfter?: RunAfterJobItem | RunAfterJobItem[];
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
  } = {}
): Promise<Array<Job<TParams, TMeta>>> {
  const {jobsToReturn = 'all'} = insertOptions;

  if (!isArray(jobsInput)) {
    jobsInput = toArray(jobsInput);
  }

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
    return newResource<Job<TParams, TMeta>>(kAppResourceType.Job, {
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
      runAfter: input.runAfter ? toArray(input.runAfter) : undefined,
      ...status,
      ...insertOptions.seed,
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

    await kSemanticModels.job().insertItem(uniqueJobs, opts);
    return (jobsToReturn === 'all' ? jobs : uniqueJobs) as Array<Job<TParams, TMeta>>;
  });
}

export async function enqueueDeleteResourceJob(params: DeleteResourceJobParams) {
  const [job] = await queueJobs(params.workspaceId, undefined, [
    {params, type: kJobType.deleteResource0},
  ]);

  return job;
}

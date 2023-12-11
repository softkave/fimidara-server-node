import {keyBy} from 'lodash';
import {AnyObject} from 'mongoose';
import winston from 'winston';
import {
  DeleteResourceJobParams,
  Job,
  JobStatusMap,
  JobType,
  JobTypeMap,
  kJobRunnerV1,
} from '../../definitions/job';
import {AppResourceTypeMap} from '../../definitions/system';
import {getTimestamp} from '../../utils/dateFns';
import {newResource} from '../../utils/resource';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';

export interface JobInput<TParams extends AnyObject = AnyObject> {
  type: JobType | (string & {});
  params: TParams;
  idempotencyToken?: string;
}

export async function queueJobs<TParams extends AnyObject = AnyObject>(
  workspaceId: string | undefined,
  parentJobId: string | undefined,
  jobsInput: JobInput<TParams>[]
) {
  if (jobsInput.length === 0) {
    return [];
  }

  const config = kUtilsInjectables.config();
  const idempotencyTokens: string[] = [];
  const newJobs = jobsInput.map(input => {
    const idempotencyToken = input.idempotencyToken || JSON.stringify(input.params);
    return newResource<Job>(AppResourceTypeMap.Job, {
      workspaceId,
      parentJobId,
      idempotencyToken,
      params: input.params,
      type: input.type,
      serverInstanceId: config.serverInstanceId,
      status: JobStatusMap.pending,
      statusDate: getTimestamp(),
      version: kJobRunnerV1,
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

    return uniqueJobs;
  });
}

export async function completeJob(jobId: string) {
  const job = await kSemanticModels.utils().withTxn(async opts => {
    const jobsModel = kSemanticModels.job();
    const [job, hasIncompleteChildren] = await Promise.all([
      jobsModel.getOneById(jobId, opts),
      jobsModel.existsByQuery({parentJobId: jobId, status: {$ne: 'completed'}}),
    ]);

    if (!job) {
      return;
    }

    return await jobsModel.getAndUpdateOneById(
      jobId,
      {
        status: hasIncompleteChildren ? 'waitingForChildren' : 'completed',
        statusDate: getTimestamp(),
      },
      opts
    );
  });

  if (job && job.status === 'completed' && job.parentJobId) {
    completeJob(job.parentJobId).catch(error => winston.error(error));
  }
}

export async function enqueueDeleteResourceJob(params: DeleteResourceJobParams) {
  const [job] = await queueJobs(params.args.workspaceId, undefined, [
    {params, type: JobTypeMap.deleteResource},
  ]);

  return job;
}

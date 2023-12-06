import {AnyObject} from 'mongoose';
import winston from 'winston';
import {Job, JobStatusMap, JobType, kJobRunnerV1} from '../../definitions/job';
import {AppResourceTypeMap} from '../../definitions/system';
import {getTimestamp} from '../../utils/dateFns';
import {newResource} from '../../utils/resource';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
import {SemanticProviderMutationRunOptions} from '../contexts/semantic/types';

export interface JobInput<TParams extends AnyObject = AnyObject> {
  type: JobType | (string & {});
  params: TParams;
}

export async function queueJobs(
  workspaceId: string | undefined,
  parentJobId: string | undefined,
  jobsInput: JobInput[],
  opts?: SemanticProviderMutationRunOptions
) {
  if (jobsInput.length === 0) {
    return;
  }

  const config = kUtilsInjectables.config();
  const newJobs = jobsInput.map(input => {
    return newResource<Job>(AppResourceTypeMap.Job, {
      workspaceId,
      parentJobId,
      params: input.params,
      type: input.type,
      serverInstanceId: config.serverInstanceId,
      status: JobStatusMap.pending,
      statusDate: getTimestamp(),
      version: kJobRunnerV1,
    });
  });

  await kSemanticModels.utils().withTxn(async opts => {
    await kSemanticModels.job().insertItem(newJobs, opts);
  }, opts);
}

export async function completeJob(
  jobId: string,
  opts?: SemanticProviderMutationRunOptions
) {
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
  }, opts);

  if (job && job.status === 'completed' && job.parentJobId) {
    completeJob(job.parentJobId).catch(error => winston.error(error));
  }
}

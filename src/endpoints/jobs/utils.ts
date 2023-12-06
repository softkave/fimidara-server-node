import {AnyObject} from 'mongoose';
import {JOB_RUNNER_V1, Job, JobStatusMap, JobType} from '../../definitions/job';
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
      version: JOB_RUNNER_V1,
    });
  });

  await kSemanticModels.utils().withTxn(async opts => {
    const jobsModel = kSemanticModels.jobs();
    let parentJob: Job | null = null;

    if (parentJobId) {
      parentJob = await jobsModel.getOneById(parentJobId, opts);
    }

    await Promise.all([
      jobsModel.insertItem(newJobs, opts),
      parentJob
        ? jobsModel.updateOneById(
            parentJob.resourceId,
            {childrenJobsCount: (parentJob.childrenJobsCount ?? 0) + newJobs.length},
            opts
          )
        : undefined,
    ]);
  }, opts);
}

export async function completeJob(
  jobId: string,
  opts?: SemanticProviderMutationRunOptions
) {
  const parentJob = await kSemanticModels.utils().withTxn(async opts => {
    const jobsModel = kSemanticModels.jobs();
    const [job, hasIncompleteChildren] = await Promise.all([
      jobsModel.getOneById(jobId, opts),
      jobsModel.existsByQuery({parentJobId: jobId, status: {$ne: 'completed'}}),
    ]);

    if (!job) {
      return;
    }

    const parentJob =
      job.parentJobId && !hasIncompleteChildren
        ? await jobsModel.getOneById(job.parentJobId, opts)
        : null;

    const result = await Promise.all([
      parentJob
        ? jobsModel.getAndUpdateOneById(
            parentJob.resourceId,
            {childrenJobsDone: (parentJob.childrenJobsDone ?? 0) + 1},
            opts
          )
        : null,
      jobsModel.updateOneById(
        jobId,
        {
          status: hasIncompleteChildren ? 'waitingForChildren' : 'completed',
          statusDate: getTimestamp(),
        },
        opts
      ),
    ]);

    return result[0];
  }, opts);

  if (parentJob && parentJob.childrenJobsCount === parentJob.childrenJobsDone) {
    await completeJob(parentJob.resourceId);
  }
}

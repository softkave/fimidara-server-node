import {
  DeleteResourceJobParams,
  IngestMountJobParams,
  Job,
  JOB_RUNNER_V1,
  JobStatusMap,
  JobTypeMap,
} from '../../definitions/job';
import {AppResourceType, AppResourceTypeMap} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {serverLogger} from '../../utils/logger/loggerUtils';
import {newResource} from '../../utils/resource';
import {BaseContextType} from '../contexts/types';
import {
  DELETE_AGENT_TOKEN_CASCADE_FNS,
  DELETE_COLLABORATION_REQUEST_CASCADE_FNS,
  DELETE_FILE_CASCADE_FNS,
  DELETE_FOLDER_CASCADE_FNS,
  DELETE_PERMISSION_GROUP_CASCADE_FNS,
  DELETE_PERMISSION_ITEMS_CASCADE_FNS,
  DELETE_TAG_CASCADE_FNS,
  DELETE_WORKSPACE_CASCADE_FNS,
  REMOVE_COLLABORATOR_CASCADE_FNS,
} from '../deleteResourceCascadeDefs';
import {DeleteResourceCascadeFnsMap} from '../types';
import {executeCascadeDelete} from '../utils';

let lastTimestamp = 0;
const pendingJobsIdList: string[] = [];
const JOB_INTERVAL = 1000; // 1 second

export async function startJobRunner(context: BaseContextType) {
  let nextJob: Job | null = null;
  nextJob = await getNextUnfinishedJob(context);
  if (!nextJob) {
    nextJob = await getNextPendingJob(context);
  }

  let promise: Promise<void> | null = null;
  if (nextJob) {
    pendingJobsIdList.push(nextJob.resourceId);
    promise = jobRunner(context, nextJob);
  }

  setTimeout(() => startJobRunner(context), JOB_INTERVAL);

  if (promise) {
    try {
      appAssert(nextJob);
      await promise;
      const index = pendingJobsIdList.indexOf(nextJob.resourceId);
      if (index !== -1) pendingJobsIdList.splice(index, 1);
      if (nextJob.createdAt > lastTimestamp) lastTimestamp = nextJob.createdAt;
    } catch (error: unknown) {
      serverLogger.error(error);
    }
  }
}

async function getNextUnfinishedJob(context: BaseContextType) {
  return await context.data.job.getOneByQuery({
    status: JobStatusMap.InProgress,

    // Avoid fetching in-progress jobs belonging to the current instance,
    // seeing those jobs are already currently being run
    serverInstanceId: {$ne: context.appVariables.serverInstanceId},
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function getNextPendingJob(context: BaseContextType) {
  return await context.data.job.getOneByQuery({
    status: JobStatusMap.Pending,
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function jobRunner(context: BaseContextType, job: Job) {
  try {
    if (job.type === JobTypeMap.DeleteResource)
      await executeDeleteResourceJob(context, job);
    await context.data.job.updateOneByQuery(
      {resourceId: job.resourceId},
      {status: JobStatusMap.Completed}
    );
  } catch (error: unknown) {
    // TODO: different parts of the app should have their own tagged loggers
    serverLogger.error(error);
    await context.data.job.updateOneByQuery(
      {resourceId: job.resourceId},
      {status: JobStatusMap.Failed, errorTimestamp: getTimestamp()}
    );
  }
}

const kCascadeDeleteDefs: Record<
  AppResourceType,
  DeleteResourceCascadeFnsMap<any> | undefined
> = {
  [AppResourceTypeMap.All]: undefined,
  [AppResourceTypeMap.System]: undefined,
  [AppResourceTypeMap.Public]: undefined,
  [AppResourceTypeMap.UsageRecord]: undefined,
  [AppResourceTypeMap.EndpointRequest]: undefined,
  [AppResourceTypeMap.AssignedItem]: undefined,
  [AppResourceTypeMap.Job]: undefined,
  [AppResourceTypeMap.FilePresignedPath]: undefined,

  // TODO: will need update when we implement deleting users
  [AppResourceTypeMap.User]: REMOVE_COLLABORATOR_CASCADE_FNS,
  [AppResourceTypeMap.CollaborationRequest]: DELETE_COLLABORATION_REQUEST_CASCADE_FNS,
  [AppResourceTypeMap.Workspace]: DELETE_WORKSPACE_CASCADE_FNS,
  [AppResourceTypeMap.AgentToken]: DELETE_AGENT_TOKEN_CASCADE_FNS,
  [AppResourceTypeMap.Folder]: DELETE_FOLDER_CASCADE_FNS,
  [AppResourceTypeMap.File]: DELETE_FILE_CASCADE_FNS,
  [AppResourceTypeMap.Tag]: DELETE_TAG_CASCADE_FNS,
  [AppResourceTypeMap.PermissionGroup]: DELETE_PERMISSION_GROUP_CASCADE_FNS,
  [AppResourceTypeMap.PermissionItem]: DELETE_PERMISSION_ITEMS_CASCADE_FNS,
};

async function executeDeleteResourceJob(context: BaseContextType, job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const cascadeDef = kCascadeDeleteDefs[params.type];
  if (cascadeDef) await executeCascadeDelete(context, cascadeDef, params.args);
}

export async function enqueueDeleteResourceJob(
  context: BaseContextType,
  params: DeleteResourceJobParams
) {
  const job: Job = newResource(AppResourceTypeMap.Job, {
    params,
    serverInstanceId: context.appVariables.serverInstanceId,
    status: JobStatusMap.Pending,
    statusDate: getTimestamp(),
    type: JobTypeMap.DeleteResource,
    version: JOB_RUNNER_V1,
    workspaceId: params.args.workspaceId,
  });
  await context.data.job.insertItem(job);
  return job;
}

export async function enqueueIngestMountJob(
  context: BaseContextType,
  params: IngestMountJobParams
) {
  const job: Job = newResource(AppResourceTypeMap.Job, {
    params,
    serverInstanceId: context.appVariables.serverInstanceId,
    status: JobStatusMap.Pending,
    statusDate: getTimestamp(),
    type: JobTypeMap.DeleteResource,
    version: JOB_RUNNER_V1,
    workspaceId: params.args.workspaceId,
  });
  await context.data.job.insertItem(job);
  return job;
}

export async function getJob(context: BaseContextType, jobId: string) {
  return await context.data.job.assertGetOneByQuery({resourceId: jobId});
}

export async function waitForServerInstanceJobs(
  context: BaseContextType,
  serverInstanceId: string
) {
  return new Promise<void>(resolve => {
    const getPendingJobs = async () => {
      const jobs = await context.data.job.getManyByQuery({
        serverInstanceId,
        status: {$in: [JobStatusMap.Pending, JobStatusMap.InProgress] as any[]},
      });

      if (!jobs.length) resolve();
      else setTimeout(getPendingJobs, 200 /** 200ms */);
    };

    getPendingJobs();
  });
}

export async function executeServerInstanceJobs(
  context: BaseContextType,
  serverInstanceId: string
) {
  const getPendingJobs = async () => {
    return await context.data.job.getManyByQuery({
      serverInstanceId,
      status: JobStatusMap.Pending,
    });
  };

  let jobs = await getPendingJobs();
  while (jobs.length) {
    await Promise.all(jobs.map(job => jobRunner(context, job)));
    jobs = await getPendingJobs();
  }
}

export async function executeJob(context: BaseContextType, jobId: string) {
  const job = await context.data.job.getOneByQuery({
    resourceId: jobId,
    status: JobStatusMap.Pending,
  });

  if (job) await jobRunner(context, job);
}

export async function waitForJob(context: BaseContextType, jobId: string) {
  return new Promise<void>(resolve => {
    const getPendingJob = async () => {
      const job = await context.data.job.getOneByQuery({
        resourceId: jobId,
        status: {$in: [JobStatusMap.Pending, JobStatusMap.InProgress] as any[]},
      });

      if (!job) resolve();
      else setTimeout(getPendingJob, 200 /** 200ms */);
    };

    getPendingJob();
  });
}

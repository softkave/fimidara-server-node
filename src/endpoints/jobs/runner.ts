import {
  DeleteResourceJobParams,
  IJob,
  JobStatus,
  JobType,
  JOB_RUNNER_V1,
} from '../../definitions/job';
import {AppResourceType} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {newResource} from '../../utils/fns';
import {DELETE_AGENT_TOKEN_CASCADE_FNS} from '../agentTokens/deleteToken/handler';
import {DELETE_COLLABORATION_REQUEST_CASCADE_FNS} from '../collaborationRequests/deleteRequest/handler';
import {IBaseContext} from '../contexts/types';
import {DELETE_FILE_CASCADE_FNS} from '../files/deleteFile/handler';
import {DELETE_FOLDER_CASCADE_FNS} from '../folders/deleteFolder/handler';
import {logger} from '../globalUtils';
import {DELETE_PERMISSION_GROUP_CASCADE_FNS} from '../permissionGroups/deletePermissionGroup/handler';
import {DELETE_PERMISSION_ITEMS_CASCADE_FNS} from '../permissionItems/deleteItems/utils';
import {DELETE_TAG_CASCADE_FNS} from '../tags/deleteTag/handler';
import {DeleteResourceCascadeFnsMap} from '../types';
import {executeCascadeDelete} from '../utils';
import {DELETE_WORKSPACE_CASCADE_FNS} from '../workspaces/deleteWorkspace/handler';

let lastTimestamp = 0;
let noPendingJobs = false;
const pendingJobsIdList: string[] = [];
const JOB_INTERVAL = 1000; // 1 second

export async function startJobRunner(context: IBaseContext) {
  let nextJob: IJob | null = null;
  if (!noPendingJobs) await getNextUnfinishedJob(context);
  if (!nextJob) {
    noPendingJobs = true;
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
      logger.error(error);
    }
  }
}

async function getNextUnfinishedJob(context: IBaseContext) {
  return await context.data.job.getOneByQuery({
    status: JobStatus.InProgress,
    serverInstanceId: {$ne: context.appVariables.serverInstanceId},
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function getNextPendingJob(context: IBaseContext) {
  return await context.data.job.getOneByQuery({
    status: JobStatus.Pending,
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function jobRunner(context: IBaseContext, job: IJob) {
  if (job.type === JobType.DeleteResource) await executeDeleteResourceJob(context, job);
}

const cascadeDeleteDefs: Record<AppResourceType, DeleteResourceCascadeFnsMap<any> | undefined> = {
  [AppResourceType.All]: undefined,
  [AppResourceType.System]: undefined,
  [AppResourceType.Public]: undefined,
  [AppResourceType.User]: undefined,
  [AppResourceType.UsageRecord]: undefined,
  [AppResourceType.EndpointRequest]: undefined,
  [AppResourceType.AssignedItem]: undefined,
  [AppResourceType.Job]: undefined,
  [AppResourceType.CollaborationRequest]: DELETE_COLLABORATION_REQUEST_CASCADE_FNS,
  [AppResourceType.Workspace]: DELETE_WORKSPACE_CASCADE_FNS,
  [AppResourceType.AgentToken]: DELETE_AGENT_TOKEN_CASCADE_FNS,
  [AppResourceType.Folder]: DELETE_FOLDER_CASCADE_FNS,
  [AppResourceType.File]: DELETE_FILE_CASCADE_FNS,
  [AppResourceType.Tag]: DELETE_TAG_CASCADE_FNS,
  [AppResourceType.PermissionGroup]: DELETE_PERMISSION_GROUP_CASCADE_FNS,
  [AppResourceType.PermissionItem]: DELETE_PERMISSION_ITEMS_CASCADE_FNS,
};

async function executeDeleteResourceJob(context: IBaseContext, job: IJob) {
  const params = job.params as DeleteResourceJobParams;
  const cascadeDef = cascadeDeleteDefs[params.type];
  if (cascadeDef) await executeCascadeDelete(context, cascadeDef, params.args);
}

export async function enqueueDeleteResourceJob(
  context: IBaseContext,
  params: DeleteResourceJobParams
) {
  const job: IJob = newResource(AppResourceType.Job, {
    params,
    serverInstanceId: context.appVariables.serverInstanceId,
    status: JobStatus.Pending,
    statusDate: getTimestamp(),
    type: JobType.DeleteResource,
    version: JOB_RUNNER_V1,
    workspaceId: params.args.workspaceId,
  });
  await context.data.job.insertItem(job);
  return job;
}

export async function getJob(context: IBaseContext, jobId: string) {
  return await context.data.job.assertGetOneByQuery({resourceId: jobId});
}

export async function waitForServerInstanceJobs(context: IBaseContext, serverInstanceId: string) {
  return new Promise<void>(resolve => {
    const getPendingJobs = async () => {
      const jobs = await context.data.job.getManyByQuery({
        serverInstanceId,
        status: {$in: [JobStatus.Pending, JobStatus.InProgress] as any[]},
      });

      if (!jobs.length) resolve();
      else setTimeout(getPendingJobs, 200 /** 200ms */);
    };

    getPendingJobs();
  });
}

export async function executeServerInstanceJobs(context: IBaseContext, serverInstanceId: string) {
  const getPendingJobs = async () => {
    return await context.data.job.getManyByQuery({
      serverInstanceId,
      status: JobStatus.Pending,
    });
  };

  let jobs = await getPendingJobs();
  while (jobs.length) {
    await Promise.all(jobs.map(job => jobRunner(context, job)));
    jobs = await getPendingJobs();
  }
}

export async function executeJob(context: IBaseContext, jobId: string) {
  const job = await context.data.job.getOneByQuery({
    resourceId: jobId,
    status: JobStatus.Pending,
  });

  if (job) await jobRunner(context, job);
}

export async function waitForJob(context: IBaseContext, jobId: string) {
  return new Promise<void>(resolve => {
    const getPendingJob = async () => {
      const job = await context.data.job.getOneByQuery({
        resourceId: jobId,
        status: {$in: [JobStatus.Pending, JobStatus.InProgress] as any[]},
      });

      if (!job) resolve();
      else setTimeout(getPendingJob, 200 /** 200ms */);
    };

    getPendingJob();
  });
}
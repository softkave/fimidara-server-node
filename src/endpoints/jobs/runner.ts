import {
  DeleteResourceJobParams,
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
  JobStatusMap,
  JobTypeMap,
} from '../../definitions/job';
import {AppResourceType, AppResourceTypeMap} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {serverLogger} from '../../utils/logger/loggerUtils';
import {kDataModels, kUtilsInjectables} from '../contexts/injectables';
import {
  kDeleteAgentTokenCascadeFns,
  kDeleteCollaborationRequestsCascadeFns,
  kDeleteFileBackendConfigCascadeFns,
  kDeleteFileBackendMountCascadeFns,
  kDeleteFileCascadeFns,
  kDeleteFoldersCascadeFns,
  kDeletePermissionGroupsCascadeFns,
  kDeletePermissionItemsCascaseFns,
  kDeleteTagsCascadeFns,
  kDeleteWorkspaceCascadeFns,
  kRemoveCollaboratorCascadeFns,
  runDeleteResourceJob,
} from '../deleteResourceCascadeDefs';
import {runIngestFolderpathJob, runIngestMountJob} from '../fileBackends/ingestionUtils';
import {DeleteResourceCascadeFnsMap} from '../types';
import {completeJob} from './utils';

let lastTimestamp = 0;
const pendingJobsIdList: string[] = [];
const JOB_INTERVAL = 1000; // 1 second

export async function startJobRunner() {
  let nextJob: Job | null = null;
  nextJob = await getNextUnfinishedJob();

  if (!nextJob) {
    nextJob = await getNextPendingJob();
  }

  let promise: Promise<void> | null = null;
  if (nextJob) {
    pendingJobsIdList.push(nextJob.resourceId);
    promise = jobRunner(nextJob);
  }

  setTimeout(() => startJobRunner(), JOB_INTERVAL);

  if (promise) {
    try {
      appAssert(nextJob);
      await promise;
      const index = pendingJobsIdList.indexOf(nextJob.resourceId);

      if (index !== -1) {
        pendingJobsIdList.splice(index, 1);
      }

      if (nextJob.createdAt > lastTimestamp) {
        lastTimestamp = nextJob.createdAt;
      }
    } catch (error: unknown) {
      serverLogger.error(error);
    }
  }
}

async function getNextUnfinishedJob() {
  const config = kUtilsInjectables.config();
  return await kDataModels.job().getOneByQuery({
    status: JobStatusMap.inProgress,

    // Avoid fetching in-progress jobs belonging to the current instance,
    // seeing those jobs are already currently being run
    serverInstanceId: {$ne: config.serverInstanceId},
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function getNextPendingJob() {
  return await kDataModels.job().getOneByQuery({
    status: JobStatusMap.pending,
    statusDate: {$gte: lastTimestamp},
    resourceId: {$nin: pendingJobsIdList},
  });
}

async function jobRunner(job: Job) {
  try {
    if (job.type === JobTypeMap.deleteResource) {
      await executeDeleteResourceJob(job);
    } else if (job.type === 'ingestFolderpath') {
      await runIngestFolderpathJob(job as Job<IngestFolderpathJobParams>);
    } else if (job.type === 'ingestMount') {
      await runIngestMountJob(job as Job<IngestMountJobParams>);
    }

    await completeJob(job.resourceId);
  } catch (error: unknown) {
    // TODO: different parts of the app should have their own tagged loggers
    serverLogger.error(error);
    await kDataModels
      .job()
      .updateOneByQuery(
        {resourceId: job.resourceId},
        {status: 'failed', statusDate: getTimestamp(), errorTimestamp: getTimestamp()}
      );
  }
}

const kCascadeDeleteDefs: Record<
  AppResourceType,
  DeleteResourceCascadeFnsMap<never> | undefined
> = {
  [AppResourceTypeMap.All]: undefined,
  [AppResourceTypeMap.System]: undefined,
  [AppResourceTypeMap.Public]: undefined,
  [AppResourceTypeMap.UsageRecord]: undefined,
  [AppResourceTypeMap.EndpointRequest]: undefined,
  [AppResourceTypeMap.AssignedItem]: undefined,
  [AppResourceTypeMap.Job]: undefined,
  [AppResourceTypeMap.FilePresignedPath]: undefined,
  [AppResourceTypeMap.ResolvedMountEntry]: undefined,

  // TODO: will need update when we implement deleting users
  [AppResourceTypeMap.User]: kRemoveCollaboratorCascadeFns,
  [AppResourceTypeMap.CollaborationRequest]: kDeleteCollaborationRequestsCascadeFns,
  [AppResourceTypeMap.Workspace]: kDeleteWorkspaceCascadeFns,
  [AppResourceTypeMap.AgentToken]: kDeleteAgentTokenCascadeFns,
  [AppResourceTypeMap.Folder]: kDeleteFoldersCascadeFns,
  [AppResourceTypeMap.File]: kDeleteFileCascadeFns,
  [AppResourceTypeMap.Tag]: kDeleteTagsCascadeFns,
  [AppResourceTypeMap.PermissionGroup]: kDeletePermissionGroupsCascadeFns,
  [AppResourceTypeMap.PermissionItem]: kDeletePermissionItemsCascaseFns,
  [AppResourceTypeMap.FileBackendConfig]: kDeleteFileBackendConfigCascadeFns,
  [AppResourceTypeMap.FileBackendMount]: kDeleteFileBackendMountCascadeFns,
};

async function executeDeleteResourceJob(job: Job) {
  const params = job.params as DeleteResourceJobParams;
  const cascadeDef = kCascadeDeleteDefs[params.type];

  if (cascadeDef) {
    await runDeleteResourceJob(cascadeDef, params.args, job);
  }
}

export async function waitForServerInstanceJobs(serverInstanceId: string) {
  return new Promise<void>(resolve => {
    const getPendingJobs = async () => {
      const jobs = await kDataModels.job().getManyByQuery({
        serverInstanceId,
        // @ts-ignore
        status: {$in: [JobStatusMap.pending, JobStatusMap.inProgress]},
      });

      if (!jobs.length) resolve();
      else setTimeout(getPendingJobs, 200 /** 200ms */);
    };

    getPendingJobs();
  });
}

export async function executeServerInstanceJobs(serverInstanceId: string) {
  const getPendingJobs = async () => {
    return await kDataModels.job().getManyByQuery({
      serverInstanceId,
      status: JobStatusMap.pending,
    });
  };

  let jobs = await getPendingJobs();
  while (jobs.length) {
    await Promise.all(jobs.map(job => jobRunner(job)));
    jobs = await getPendingJobs();
  }
}

export async function executeJob(jobId: string) {
  const job = await kDataModels.job().getOneByQuery({
    resourceId: jobId,
    status: JobStatusMap.pending,
  });

  if (job) {
    await jobRunner(job);
  }
}

export async function waitForJob(jobId: string) {
  return new Promise<void>(resolve => {
    const getPendingJob = async () => {
      const job = await kDataModels.job().getOneByQuery({
        resourceId: jobId,
        status: {
          // @ts-ignore
          $in: [JobStatusMap.pending, JobStatusMap.inProgress],
        },
      });

      if (!job) resolve();
      else setTimeout(getPendingJob, 200 /** 200ms */);
    };

    getPendingJob();
  });
}

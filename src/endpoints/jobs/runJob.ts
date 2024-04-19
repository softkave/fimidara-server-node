import {
  Job,
  JobStatus,
  JobStatusHistory,
  JobType,
  kJobStatus,
  kJobType,
} from '../../definitions/job';
import {getTimestamp} from '../../utils/dateFns';
import {noopAsync} from '../../utils/fns';
import {AnyFn} from '../../utils/types';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {runCleanupMountResolvedEntriesJob} from './runners/runCleanupMountResolvedEntriesJob';
import {runDeletePermissionItemsJob} from './runners/runDeletePermissionItemsJob';
import {runDeleteResourceJob0} from './runners/runDeleteResourceJob/runDeleteResourceJob0';
import {runDeleteResourceJobArtifacts} from './runners/runDeleteResourceJob/runDeleteResourceJobArtifacts';
import {runDeleteResourceJobSelf} from './runners/runDeleteResourceJob/runDeleteResourceJobSelf';
import {runEmailJob} from './runners/runEmailJob/runEmailJob';
import {runIngestFolderpathJob} from './runners/runIngestFolderpathJob';
import {runIngestMountJob} from './runners/runIngestMountJob';

export async function completeJob(
  jobId: string,
  status: JobStatus = kJobStatus.completed
) {
  const job = await kSemanticModels.utils().withTxn(async opts => {
    const jobsModel = kSemanticModels.job();
    const [job, hasPendingChild, hasFailedChild] = await Promise.all([
      jobsModel.getOneById(jobId, opts),
      jobsModel.existsByQuery(
        {
          parents: jobId,
          status: {
            $in: [
              kJobStatus.pending,
              kJobStatus.inProgress,
              kJobStatus.waitingForChildren,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ] as any[],
          },
        },
        opts
      ),
      jobsModel.existsByQuery({parents: jobId, status: {$eq: kJobStatus.failed}}, opts),
    ]);

    if (!job) {
      return;
    }

    const statusItem: JobStatusHistory = {
      status: hasFailedChild
        ? kJobStatus.failed
        : hasPendingChild
        ? kJobStatus.waitingForChildren
        : status,
      statusLastUpdatedAt: getTimestamp(),
      runnerId: job.runnerId,
    };

    return await jobsModel.getAndUpdateOneById(
      jobId,
      {...statusItem, statusHistory: job.statusHistory.concat(statusItem)},
      opts
    );
  }, /** reuseTxn */ true);

  if (
    job &&
    (job.status === kJobStatus.completed || job.status === kJobStatus.failed) &&
    job.parentJobId
  ) {
    kUtilsInjectables.promises().forget(completeJob(job.parentJobId));
  }

  return job;
}

const kJobTypeToHandlerMap: Record<JobType, AnyFn<[Job], Promise<void>>> = {
  [kJobType.deleteResource0]: runDeleteResourceJob0,
  [kJobType.deleteResourceArtifacts]: runDeleteResourceJobArtifacts,
  [kJobType.deleteResourceSelf]: runDeleteResourceJobSelf,
  [kJobType.deletePermissionItem]: runDeletePermissionItemsJob,
  [kJobType.ingestFolderpath]: runIngestFolderpathJob,
  [kJobType.ingestMount]: runIngestMountJob,
  [kJobType.cleanupMountResolvedEntries]: runCleanupMountResolvedEntriesJob,
  [kJobType.email]: runEmailJob,
  [kJobType.noop]: noopAsync,
  [kJobType.fail]: async () => {
    throw new Error('Fail job');
  },
};

export async function runJob(job: Job) {
  try {
    const handler = kJobTypeToHandlerMap[job.type];
    await handler(job);
    return await completeJob(job.resourceId);
  } catch (error: unknown) {
    kUtilsInjectables.logger().log(`Job ${job.resourceId} failed with error`);
    kUtilsInjectables.logger().error(error);
    return await completeJob(job.resourceId, kJobStatus.failed);
  }
}

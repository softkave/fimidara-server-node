import {kIjxUtils} from '../../contexts/ijx/injectables.js';
import {Job, JobType, kJobStatus, kJobType} from '../../definitions/job.js';
import {noopAsync} from '../../utils/fns.js';
import {AnyFn} from '../../utils/types.js';
import {completeJob} from './completeJob.js';
import {runCleanupMountResolvedEntriesJob} from './runners/runCleanupMountResolvedEntriesJob.js';
import {runCompleteMultipartUploadJob} from './runners/runCompleteMultipartUploadJob.js';
import {runDeletePermissionItemsJob} from './runners/runDeletePermissionItemsJob.js';
import {runDeleteResourceJob} from './runners/runDeleteResourceJob/runDeleteResourceJob.js';
import {runEmailJob} from './runners/runEmailJob/runEmailJob.js';
import {runIngestFolderpathJob} from './runners/runIngestFolderpathJob.js';
import {runIngestMountJob} from './runners/runIngestMountJob.js';
import {runNewSignupsOnWaitlistJob} from './runners/runNewSignupsOnWaitlistJob.js';

const kJobTypeToHandlerMap: Record<JobType, AnyFn<[Job], Promise<void>>> = {
  [kJobType.deleteResource]: runDeleteResourceJob,
  [kJobType.deletePermissionItem]: runDeletePermissionItemsJob,
  [kJobType.ingestFolderpath]: runIngestFolderpathJob,
  [kJobType.ingestMount]: runIngestMountJob,
  [kJobType.cleanupMountResolvedEntries]: runCleanupMountResolvedEntriesJob,
  [kJobType.newSignupsOnWaitlist]: runNewSignupsOnWaitlistJob,
  [kJobType.email]: runEmailJob,
  [kJobType.completeMultipartUpload]: runCompleteMultipartUploadJob,
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
    kIjxUtils.logger().log(`Job ${job.resourceId} failed with error`);
    kIjxUtils.logger().error(error);
    return await completeJob(
      job.resourceId,
      kJobStatus.failed,
      /** ifStatus */ undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

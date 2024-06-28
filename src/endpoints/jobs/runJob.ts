import {Job, JobType, kJobStatus, kJobType} from '../../definitions/job.js';
import {noopAsync} from '../../utils/fns.js';
import {AnyFn} from '../../utils/types.js';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {completeJob} from './completeJob.js';
import {runCleanupMountResolvedEntriesJob} from './runners/runCleanupMountResolvedEntriesJob.js';
import {runDeletePermissionItemsJob} from './runners/runDeletePermissionItemsJob.js';
import {runDeleteResourceJob} from './runners/runDeleteResourceJob/runDeleteResourceJob.js';
import {runEmailJob} from './runners/runEmailJob/runEmailJob.js';
import {runIngestFolderpathJob} from './runners/runIngestFolderpathJob.js';
import {runIngestMountJob} from './runners/runIngestMountJob.js';

const kJobTypeToHandlerMap: Record<JobType, AnyFn<[Job], Promise<void>>> = {
  [kJobType.deleteResource]: runDeleteResourceJob,
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

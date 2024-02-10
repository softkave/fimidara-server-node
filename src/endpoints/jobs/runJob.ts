import {noop} from 'lodash';
import {
  CleanupMountResolvedEntriesJobParams,
  IngestFolderpathJobParams,
  IngestMountJobParams,
  Job,
  JobStatus,
  JobStatusHistory,
  kJobStatus,
  kJobType,
} from '../../definitions/job';
import {getTimestamp} from '../../utils/dateFns';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {runCleanupMountResolvedEntriesJob} from './runners/runCleanupMountResolvedEntriesJob';
import {
  runDeleteResourceJob0,
  runDeleteResourceJobArtifacts,
  runDeleteResourceJobSelf,
} from './runners/runDeleteResourceJob';
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
  });

  if (
    job &&
    (job.status === kJobStatus.completed || job.status === kJobStatus.failed) &&
    job.parentJobId
  ) {
    kUtilsInjectables.promises().forget(completeJob(job.parentJobId));
  }

  return job;
}

export async function runJob(job: Job) {
  try {
    if (job.type === kJobType.deleteResource0) {
      await runDeleteResourceJob0(job);
    } else if (job.type === kJobType.deleteResourceArtifacts) {
      await runDeleteResourceJobArtifacts(job);
    } else if (job.type === kJobType.deleteResourceSelf) {
      await runDeleteResourceJobSelf(job);
    } else if (job.type === kJobType.ingestFolderpath) {
      await runIngestFolderpathJob(job as Job<IngestFolderpathJobParams>);
    } else if (job.type === kJobType.ingestMount) {
      await runIngestMountJob(job as Job<IngestMountJobParams>);
    } else if (job.type === kJobType.noop) {
      noop();
    } else if (job.type === kJobType.cleanupMountResolvedEntries) {
      await runCleanupMountResolvedEntriesJob(
        job as Job<CleanupMountResolvedEntriesJobParams>
      );
    } else if (job.type === kJobType.fail) {
      throw new Error('Fail job');
    } else {
      kUtilsInjectables.logger().log(`unknown job type ${job.type}`);
      return undefined;
    }

    return await completeJob(job.resourceId);
  } catch (error: unknown) {
    kUtilsInjectables.logger().error(error);
    return await completeJob(job.resourceId, kJobStatus.failed);
  }
}

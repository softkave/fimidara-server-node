import {isNumber} from 'lodash-es';
import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {
  Job,
  JobStatus,
  JobStatusHistory,
  kJobRunCategory,
  kJobStatus,
} from '../../definitions/job.js';
import {JobHistory} from '../../definitions/jobHistory.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {newResource} from '../../utils/resource.js';

export async function completeJob(
  jobId: string,
  inputStatus?: JobStatus,
  ifStatus?: JobStatus[],
  errorMessage?: string
) {
  const job = await kIjxSemantic.utils().withTxn(async opts => {
    const jobsModel = kIjxSemantic.job();
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
      jobsModel.existsByQuery(
        {parents: jobId, status: {$eq: kJobStatus.failed}},
        opts
      ),
    ]);

    if (!job || (ifStatus?.length && !ifStatus.includes(job.status))) {
      return;
    }

    let jobUpdate: Partial<Job> = {};
    let status = hasFailedChild
      ? kJobStatus.failed
      : hasPendingChild
        ? kJobStatus.waitingForChildren
        : inputStatus || kJobStatus.completed;

    if (job.status === status) {
      return;
    }

    const jobHistoryEntry: JobHistory[] = [
      newResource(kFimidaraResourceType.jobHistory, {
        status,
        errorMessage,
        jobId: job.resourceId,
        runnerId: job.runnerId,
      }),
    ];

    if (
      status !== kJobStatus.waitingForChildren &&
      job.runCategory === kJobRunCategory.cron &&
      isNumber(job.cronInterval)
    ) {
      status = kJobStatus.pending;
      jobUpdate = {
        ...jobUpdate,
        cooldownTill: Date.now() + job.cronInterval,
        runnerId: undefined,
      };

      // Add a new history entry for the cron job indicating that it is pending
      jobHistoryEntry.push(
        newResource(kFimidaraResourceType.jobHistory, {
          status,
          jobId: job.resourceId,
          runnerId: job.runnerId,
        })
      );
    }

    const statusItem: JobStatusHistory = {
      status,
      errorMessage,
      runnerId: job.runnerId,
      statusLastUpdatedAt: getTimestamp(),
    };

    jobUpdate = {...jobUpdate, ...statusItem};
    const [savedJob] = await Promise.all([
      jobsModel.getAndUpdateOneById(jobId, jobUpdate, opts),
      kIjxSemantic.jobHistory().insertItem(jobHistoryEntry, opts),
    ]);

    return savedJob;
  });

  if (
    (job?.status === kJobStatus.failed ||
      job?.status === kJobStatus.completed) &&
    job.parentJobId
  ) {
    kIjxUtils.promises().callAndForget(() =>
      completeJob(
        job.parentJobId!,
        job.status,
        // if job is completed and parent is waiting, then mark complete. if
        // job failed, then also mark parent failed.
        job.status === kJobStatus.completed
          ? [kJobStatus.waitingForChildren]
          : undefined
      )
    );
  }

  return job;
}

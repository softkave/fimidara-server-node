import assert from 'assert';
import {first} from 'lodash-es';
import {expect} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {Job, JobStatus, kJobStatus} from '../../../definitions/job.js';
import {runJob} from '../../jobs/runJob.js';

/** Expects there isn't any other runner running jobs in provided shard, and
 * only runs pending jobs. Also a tad inefficient. */
export async function executeShardJobs(shard: string) {
  let jobs: Job[] = [];

  do {
    jobs = await kIjxSemantic
      .job()
      .getManyByQuery({shard, status: kJobStatus.pending});

    // TODO: seeing we're using Promise.allSettled(), if a job fails, and
    // updating DB of the failure fails, that'll leave the job in progress,
    // though executeShardJobs will complete as if all jobs were run.
    await Promise.allSettled(jobs.map(runJob));
  } while (jobs.length > 0);
}

export async function confirmJobHistoryEntry(job: Job, status?: JobStatus) {
  const jobHistoryList = await kIjxSemantic
    .jobHistory()
    .getManyByQuery(
      {jobId: job.resourceId, status: status || job.status},
      {sort: {createdAt: 'desc'}}
    );
  const jobHistory = first(jobHistoryList);

  assert(
    jobHistory,
    `No job history with jobId=${job.resourceId} status=${job.status}`
  );
  expect(jobHistory.jobId).toBe(job.resourceId);
  expect(jobHistory.runnerId ?? null).toBe(job.runnerId ?? null);
}

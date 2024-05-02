import {Job, kJobStatus} from '../../../definitions/job.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {runJob} from '../../jobs/runJob.js';

/** Expects there isn't any other runner running jobs in provided shard, and
 * only runs pending jobs. Also a tad inefficient. */
export async function executeShardJobs(shard: string) {
  let jobs: Job[] = [];

  do {
    jobs = await kSemanticModels
      .job()
      .getManyByQuery({shard, status: kJobStatus.pending});

    // TODO: seeing we're using Promise.allSettled(), if a job fails, and
    // updating DB of the failure fails, that'll leave the job in progress,
    // though executeShardJobs will complete as if all jobs were run.
    await Promise.allSettled(jobs.map(runJob));
  } while (jobs.length > 0);
}

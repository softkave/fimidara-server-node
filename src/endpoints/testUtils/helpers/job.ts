import {Job, kJobStatus} from '../../../definitions/job';
import {kSemanticModels} from '../../contexts/injectables';
import {runJob} from '../../jobs/utils';

/** Expects there isn't any other runner running jobs in provided shard. */
export async function executeShardJobs(shard: string) {
  let jobs: Job[] = [];

  do {
    jobs = await kSemanticModels.job().getManyByQuery({shard});

    // TODO: seeing we're using Promise.allSettled(), if a job fails, and
    // updating DB of the failure fails, that'll leave the job in progress,
    // though executeShardJobs will complete as if all jobs were run.
    await Promise.allSettled(
      jobs.map(async job => {
        if (job.status === kJobStatus.pending) {
          await runJob(job);
        }
      })
    );
  } while (jobs.length > 0);
}

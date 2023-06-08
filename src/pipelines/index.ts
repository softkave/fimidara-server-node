import {fimidaraConfig} from '@/resources/vars';
import {CronJob} from 'cron';
import {getMongoConnection} from '../db/connection';
import {aggregateRecords} from './aggregate-usage-records/aggregateUsageRecords';
import {unlockUsageThresholdLocks} from './unlock-usage-threshold-locks/unlockUsageThresholdLocks';
import {FimidaraPipelineNames, pipelineRunInfoFactory} from './utils';

// TODO: move to worker thread
// TODO: have a mechanism to preven the start of another until the previous is
// done
const aggregateUsageRecordsJob = new CronJob(
  /** cronTime */ '0 */10 * * * *', // every 10 minutes
  /** onTick */ async function () {
    const runInfo = pipelineRunInfoFactory({
      job: FimidaraPipelineNames.AggregateUsageRecordsJob,
    });

    try {
      runInfo.logger.info('Aggregate usage records job started');
      const connection = await getMongoConnection(
        fimidaraConfig.mongoDbURI,
        fimidaraConfig.mongoDbDatabaseName
      );
      await aggregateRecords(connection, runInfo);
    } catch (err: any) {
      runInfo.logger.info('Error in aggregate usage records job: ');
      runInfo.logger.error(err);
    }

    await runInfo.logger.close();
  },
  /** onComplete */ null,
  /** startNow */ false,
  /** timeZone */ undefined,
  /** context */ undefined,
  /** runOnInit */ false,
  /** utcOffset */ undefined,
  /** unrefTimeout */ false
);

const unlockWorkspaceLocksJob = new CronJob(
  /** cronTime */ '0 0 */27 * *', // every month on the 27th at midnight
  /** onTick */ async function () {
    const runInfo = pipelineRunInfoFactory({
      job: FimidaraPipelineNames.UnlockWorkspaceLocksJob,
    });

    try {
      runInfo.logger.info('Unlocking workspace locks job started');
      const connection = await getMongoConnection(
        fimidaraConfig.mongoDbURI,
        fimidaraConfig.mongoDbDatabaseName
      );

      await unlockUsageThresholdLocks(connection);
    } catch (error: any) {
      runInfo.logger.info('Error in unlocking workspace locks job: ');
      runInfo.logger.error(error);
    }

    await runInfo.logger.close();
  },
  /** onComplete */ null,
  /** startNow */ false,
  /** timeZone */ undefined,
  /** context */ undefined,
  /** runOnInit */ false,
  /** utcOffset */ undefined,
  /** unrefTimeout */ false
);

export function startJobs() {
  aggregateUsageRecordsJob.start();
  unlockWorkspaceLocksJob.start();
}

import {CronJob} from 'cron';
import {getMongoConnection} from '../db/connection';
import {getTestVars} from '../endpoints/test-utils/vars';
import {aggregateRecords} from './aggregate-usage-records/aggregateUsageRecords';
import {unlockUsageThresholdLocks} from './unlock-usage-threshold-locks/unlockUsageThresholdLocks';

const aggregateUsageRecordsJob = new CronJob(
  /** cronTime */ '* 5 * * * *', // every 5 minutes
  /** onTick */ async function () {
    try {
      console.log('Aggregate usage records job started');
      const appVariables = getTestVars();
      const connection = await getMongoConnection(
        appVariables.mongoDbURI,
        appVariables.mongoDbDatabaseName
      );

      await aggregateRecords(connection);
    } catch (err: any) {
      console.log('Error in aggregate usage records job: ');
      console.error(err);
    }
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
  /** cronTime */ '0 0 0 27 * *', // every month on the 27th at midnight
  /** onTick */ async function () {
    try {
      console.log('Unlocking workspace locks job started');
      const appVariables = getTestVars();
      const connection = await getMongoConnection(
        appVariables.mongoDbURI,
        appVariables.mongoDbDatabaseName
      );

      await unlockUsageThresholdLocks(connection);
    } catch (error: any) {
      console.log('Error in unlocking workspace locks job: ');
      console.error(error);
    }
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

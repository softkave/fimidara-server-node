import {CronJob} from 'cron';
import {getMongoConnection} from '../db/connection';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {getSuppliedConfig} from '../resources/config';
import {appAssert} from '../utils/assertion';
import {aggregateRecords} from './aggregate-usage-records/aggregateUsageRecords';
import {unlockUsageThresholdLocks} from './unlock-usage-threshold-locks/unlockUsageThresholdLocks';

// TODO: move to worker thread
// TODO: have a mechanism to preven the start of another until the previous is
// done
const aggregateUsageRecordsJob = new CronJob(
  /** cronTime */ '0 */10 * * * *', // every 10 minutes
  /** onTick */ async () => {
    try {
      kUtilsInjectables.logger().log('Aggregate usage records job started');
      const config = await getSuppliedConfig();
      appAssert(config.mongoDbURI);
      appAssert(config.mongoDbDatabaseName);

      const {connection} = await getMongoConnection(
        config.mongoDbURI,
        config.mongoDbDatabaseName
      );
      await aggregateRecords(connection);
    } catch (err: unknown) {
      kUtilsInjectables.logger().log('Error in aggregate usage records job: ');
      kUtilsInjectables.logger().error(err);
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
  /** cronTime */ '0 0 */27 * *', // every month on the 27th at midnight
  /** onTick */ async () => {
    try {
      kUtilsInjectables.logger().log('Unlocking workspace locks job started');
      const config = await getSuppliedConfig();
      appAssert(config.mongoDbURI);
      appAssert(config.mongoDbDatabaseName);

      const {connection} = await getMongoConnection(
        config.mongoDbURI,
        config.mongoDbDatabaseName
      );

      await unlockUsageThresholdLocks(connection);
    } catch (error: unknown) {
      kUtilsInjectables.logger().log('Error in unlocking workspace locks job: ');
      kUtilsInjectables.logger().error(error);
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

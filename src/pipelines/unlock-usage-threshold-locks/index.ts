import {getMongoConnection} from '../../db/connection';
import {consoleLogger} from '../../endpoints/contexts/consoleLogger';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

async function unlockUsageThresholdLocksMain() {
  consoleLogger.info('Unlocking workspace locks job started');
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  await unlockUsageThresholdLocks(connection);
  await connection.close();
}

unlockUsageThresholdLocksMain()
  .then(() => {
    consoleLogger.info('Unlocking usage threshold locks job completed');
  })
  .catch(err => {
    consoleLogger.error(err);
  });

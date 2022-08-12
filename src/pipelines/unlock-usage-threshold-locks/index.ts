import {getMongoConnection} from '../../db/connection';
import {
  extractProdEnvsSchema,
  getAppVariables,
} from '../../resources/appVariables';
import {unlockUsageThresholdLocks} from './unlockUsageThresholdLocks';

async function unlockUsageThresholdLocksMain() {
  console.log('Unlocking workspace locks job started');
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
    console.log('Unlocking usage threshold locks job completed');
  })
  .catch(err => {
    console.error(err);
  });

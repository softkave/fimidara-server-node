import mongoose from 'mongoose';
import {dropMongoDBAndEndConnection} from '../endpoints/testUtils/helpers/mongo';
import {FimidaraSuppliedConfig, getSuppliedConfig} from '../resources/config';
import {testLogger} from '../utils/logger/loggerUtils';

async function dropMongoCollections(config: FimidaraSuppliedConfig) {
  const mongoURI = config.mongoDbURI;
  const appDbName = config.mongoDbDatabaseName;

  if (!mongoURI || !appDbName) {
    return;
  }

  testLogger.info(`Dropping db - ${appDbName}`);

  const connection = await mongoose
    .createConnection(mongoURI, {dbName: appDbName})
    .asPromise();
  await dropMongoDBAndEndConnection(connection);
}

async function jestGlobalTeardown() {
  const config = await getSuppliedConfig();
  const dropMongoPromise = dropMongoCollections(config);
  await Promise.all([dropMongoPromise, testLogger.close()]);
}

module.exports = jestGlobalTeardown;

import mongoose from 'mongoose';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables.js';
import {dropMongoDBAndEndConnection} from '../endpoints/testUtils/helpers/mongo.js';
import {FimidaraSuppliedConfig, getSuppliedConfig} from '../resources/config.js';

async function dropMongoCollections(config: FimidaraSuppliedConfig) {
  const mongoURI = config.mongoDbURI;
  const appDbName = config.mongoDbDatabaseName;

  if (!mongoURI || !appDbName) {
    return;
  }

  kUtilsInjectables.logger().log(`Dropping db - ${appDbName}`);

  const connection = await mongoose
    .createConnection(mongoURI, {dbName: appDbName})
    .asPromise();
  await dropMongoDBAndEndConnection(connection);
}

async function jestGlobalTeardown() {
  const config = await getSuppliedConfig();
  const dropMongoPromise = dropMongoCollections(config);
  await Promise.all([dropMongoPromise]);

  // {@link https://nodejs.org/docs/latest/api/process.html#processgetactiveresourcesinfo}
  // kUtilsInjectables.logger().log('Active resources ', getActiveResourcesInfo());

  // TODO: there are open handles keeping the test from closing, find and fix
  // them, then remove this
  // eslint-disable-next-line no-process-exit
  process.exit();
}

module.exports = jestGlobalTeardown;

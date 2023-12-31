import mongoose from 'mongoose';
import 'reflect-metadata';
import {dropMongoConnection} from '../endpoints/testUtils/helpers/mongo';
import {FimidaraSuppliedConfig, getSuppliedConfig} from '../resources/config';
import {testLogger} from '../utils/logger/loggerUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && testLogger.error(result.reason)
  );
}

async function dropMongoCollections(config: FimidaraSuppliedConfig) {
  const mongoURI = config.mongoDbURI;
  const appDbName = config.mongoDbDatabaseName;

  if (!mongoURI) {
    return;
  }

  async function dropFn(name?: string) {
    if (!name) {
      return;
    }

    testLogger.info(`Dropping db - ${name}`);

    if (config.mongoDbURI) {
      const connection = await mongoose
        .createConnection(config.mongoDbURI, {dbName: name})
        .asPromise();
      await dropMongoConnection(connection);
    }
  }

  await waitOnPromises([dropFn(appDbName)]);
}

async function jestGlobalTeardown() {
  const config = await getSuppliedConfig();
  const dropMongoPromise = dropMongoCollections(config);
  await waitOnPromises([dropMongoPromise]);
  await testLogger.close();
}

module.exports = jestGlobalTeardown;

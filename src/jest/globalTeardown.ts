import mongoose from 'mongoose';
import {globalDispose} from '../endpoints/contexts/globalUtils';
import {dropMongoConnection} from '../endpoints/testUtils/helpers/mongo';
import {FimidaraConfig} from '../resources/types';
import {fimidaraConfig} from '../resources/vars';
import {testLogger} from '../utils/logger/loggerUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function waitOnPromises(promises: Promise<any>[]) {
  (await Promise.allSettled(promises)).forEach(
    result => result.status === 'rejected' && testLogger.error(result.reason)
  );
}

async function dropMongoCollections(globals: FimidaraConfig) {
  const mongoURI = globals.mongoDbURI;
  const appDbName = globals.mongoDbDatabaseName;
  if (!mongoURI) {
    return;
  }

  async function dropFn(name?: string) {
    if (!name) {
      return;
    }

    testLogger.info(`Dropping db - ${name}`);
    const connection = await mongoose
      .createConnection(mongoURI, {dbName: name})
      .asPromise();
    await dropMongoConnection(connection);
  }

  await waitOnPromises([dropFn(appDbName)]);
}

async function jestGlobalTeardown() {
  const dropMongoPromise = dropMongoCollections(fimidaraConfig);
  await waitOnPromises([dropMongoPromise]);
  await testLogger.close();
  globalDispose();
}

module.exports = jestGlobalTeardown;

import mongoose from 'mongoose';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {dropMongoDBAndEndConnection} from '../endpoints/testUtils/helpers/mongo.js';
import {FimidaraSuppliedConfig} from '../resources/config.js';

export async function dropMongoCollections(config: FimidaraSuppliedConfig) {
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

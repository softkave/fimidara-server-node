import {format} from 'date-fns';
import mongoose from 'mongoose';
import {
  ITestVariables,
  TestDataProviderType,
} from '../src/endpoints/test-utils/vars';
import {AppEnvVariables} from '../src/resources/appVariables';

export async function setupMongoDb(
  vars: Partial<ITestVariables>,
  testType = 'test'
) {
  let dbName = vars.mongoDbDatabaseName;
  const mongoDbURI = vars.mongoDbURI;
  const useMongoDataProvider =
    vars.dataProviderType === TestDataProviderType.Mongo;

  if (!mongoDbURI || !useMongoDataProvider) {
    return;
  }

  if (useMongoDataProvider && !dbName) {
    const formattedDate = format(new Date(), 'MMM-d-YYY');
    dbName = `fimidara-node-${testType}-${formattedDate}`;
    vars.mongoDbDatabaseName = dbName;
    process.env[AppEnvVariables.MONGODB_DATABASE_NAME] = dbName;

    const mongoClient = new mongoose.mongo.MongoClient(mongoDbURI);
    await mongoClient.connect();
    mongoClient.db(dbName);
    await mongoClient.close();
  }
}

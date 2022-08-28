import {format} from 'date-fns';
import mongoose from 'mongoose';
import {AppEnvVariables, IAppVariables} from '../resources/vars';

export async function setupMongoDb(
  vars: Partial<IAppVariables>,
  testType = 'test'
) {
  let dbName = vars.mongoDbDatabaseName;
  const mongoDbURI = vars.mongoDbURI;
  if (!mongoDbURI) {
    return;
  }

  if (!dbName) {
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

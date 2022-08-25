import {getMongoConnection} from '../../db/connection';
import {consoleLogger} from '../../endpoints/contexts/consoleLogger';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {aggregateRecords} from './aggregateUsageRecords';

async function aggregateRecordsMain() {
  consoleLogger.info('Aggregate usage records job started');
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  await aggregateRecords(connection);
  await connection.close();
}

aggregateRecordsMain()
  .then(() => {
    consoleLogger.info('Aggregate usage records job completed');
  })
  .catch(err => {
    consoleLogger.error(err);
  });

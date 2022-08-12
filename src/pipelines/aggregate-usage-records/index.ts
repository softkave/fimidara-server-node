import {getMongoConnection} from '../../db/connection';
import {
  extractProdEnvsSchema,
  getAppVariables,
} from '../../resources/appVariables';
import {aggregateRecords} from './aggregateUsageRecords';

async function aggregateRecordsMain() {
  console.log('Aggregate usage records job started');
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
    console.log('Aggregate usage records job completed');
  })
  .catch(err => {
    console.error(err);
  });

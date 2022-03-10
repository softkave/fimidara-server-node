import {getMongoConnection} from '../src/db/connection';
import BaseContext from '../src/endpoints/contexts/BaseContext';
import {S3FilePersistenceProviderContext} from '../src/endpoints/contexts/FilePersistenceProviderContext';
import MongoDBDataProviderContext from '../src/endpoints/contexts/MongoDBDataProviderContext';
import {setupApp} from '../src/endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../src/endpoints/test-utils/context/NoopEmailProviderContext';
import {getTestVars} from '../src/endpoints/test-utils/vars';

async function integrationTestGlobalSetup() {
  const appVariables = getTestVars();
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const ctx = new BaseContext(
    new MongoDBDataProviderContext(connection),
    new NoopEmailProviderContext(),
    new S3FilePersistenceProviderContext(appVariables.awsRegion),
    appVariables
  );

  await setupApp(ctx);
  await connection.close();
}

module.exports = integrationTestGlobalSetup;

import {getMongoConnection} from '../db/connection';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
} from '../endpoints/contexts/BaseContext';
import MongoDBDataProviderContext from '../endpoints/contexts/MongoDBDataProviderContext';
import {setupApp} from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/test-utils/context/NoopEmailProviderContext';
import NoopFilePersistenceProviderContext from '../endpoints/test-utils/context/NoopFilePersistenceProviderContext';
import {extractEnvVariables, extractProdEnvsSchema} from '../resources/vars';

async function testGlobalSetup() {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const ctx = new BaseContext(
    new MongoDBDataProviderContext(connection),
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders(),
    () => connection.close()
  );

  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = testGlobalSetup;

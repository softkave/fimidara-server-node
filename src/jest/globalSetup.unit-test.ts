import {getMongoConnection} from '../db/connection';
import BaseContext from '../endpoints/contexts/BaseContext';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
} from '../endpoints/contexts/utils';
import {setupApp} from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/testUtils/context/NoopEmailProviderContext';
import NoopFilePersistenceProviderContext from '../endpoints/testUtils/context/NoopFilePersistenceProviderContext';
import {extractEnvVariables, extractProdEnvsSchema} from '../resources/vars';

async function testGlobalSetup() {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    getDataProviders(models),
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    appVariables,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );

  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = testGlobalSetup;

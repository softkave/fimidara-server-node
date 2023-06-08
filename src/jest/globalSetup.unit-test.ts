import {getMongoConnection} from '../db/connection';
import BaseContext from '../endpoints/contexts/BaseContext';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestOnlyAppWorkspaceDataIntoMemstore,
} from '../endpoints/contexts/utils';
import {setupApp} from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/testUtils/context/NoopEmailProviderContext';
import NoopFilePersistenceProviderContext from '../endpoints/testUtils/context/NoopFilePersistenceProviderContext';
import {fimidaraConfig} from '../resources/vars';

async function testGlobalSetup() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    getDataProviders(models),
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    fimidaraConfig,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );

  await ingestOnlyAppWorkspaceDataIntoMemstore(ctx);
  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = testGlobalSetup;

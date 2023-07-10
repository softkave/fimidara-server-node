import {getMongoConnection} from '../db/connection';
import BaseContext, {getFileProvider} from '../endpoints/contexts/BaseContext';
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
import {fimidaraConfig} from '../resources/vars';

async function integrationTestGlobalSetup() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    getDataProviders(models),
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    connection,
    () => connection.close()
  );

  await ingestOnlyAppWorkspaceDataIntoMemstore(ctx);
  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = integrationTestGlobalSetup;

import {getMongoConnection} from '../db/connection';
import BaseContext from '../endpoints/contexts/BaseContext';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
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
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models,
    () => connection.close()
  );
  await ctx.init();
  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = testGlobalSetup;

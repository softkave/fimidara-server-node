import { getMongoConnection } from '../db/connection';
import {
    getLogicProviders,
    getMongoBackedSemanticDataProviders,
    getMongoDataProviders,
    getMongoModels,
} from '../endpoints/contexts/utils';
import { setupApp } from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/testUtils/context/email/NoopEmailProviderContext';
import { fimidaraConfig } from '../resources/vars';
import Base {getFileProvider} from '../endpoints/contexts/BaseContext';

async function integrationTestGlobalSetup() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
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

module.exports = integrationTestGlobalSetup;

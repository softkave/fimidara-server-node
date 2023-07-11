import {getMongoConnection} from '../db/connection';
import BaseContext, {getFileProvider} from '../endpoints/contexts/BaseContext';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
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
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    () => connection.close()
  );
  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = integrationTestGlobalSetup;

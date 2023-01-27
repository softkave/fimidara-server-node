import {getMongoConnection} from '../db/connection';
import BaseContext from '../endpoints/contexts/BaseContext';
import {getDataProviders} from '../endpoints/contexts/utils';
import {setupApp} from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/test-utils/context/NoopEmailProviderContext';
import NoopFilePersistenceProviderContext from '../endpoints/test-utils/context/NoopFilePersistenceProviderContext';
import {extractEnvVariables, extractProdEnvsSchema} from '../resources/vars';

async function testGlobalSetup() {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(appVariables.mongoDbURI, appVariables.mongoDbDatabaseName);
  const ctx = new BaseContext(
    getDataProviders(connection),
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    appVariables,
    () => connection.close()
  );

  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = testGlobalSetup;

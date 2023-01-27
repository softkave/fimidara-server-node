import {getMongoConnection} from '../db/connection';
import BaseContext from '../endpoints/contexts/BaseContext';
import {S3FilePersistenceProviderContext} from '../endpoints/contexts/FilePersistenceProviderContext';
import {getDataProviders} from '../endpoints/contexts/utils';
import {setupApp} from '../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../endpoints/test-utils/context/NoopEmailProviderContext';
import {extractEnvVariables, extractProdEnvsSchema} from '../resources/vars';

async function integrationTestGlobalSetup() {
  const appVariables = extractEnvVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(appVariables.mongoDbURI, appVariables.mongoDbDatabaseName);

  const ctx = new BaseContext(
    getDataProviders(connection),
    new NoopEmailProviderContext(),
    new S3FilePersistenceProviderContext(appVariables.awsRegion),
    appVariables,

    () => connection.close()
  );

  await setupApp(ctx);
  await ctx.dispose();
}

module.exports = integrationTestGlobalSetup;

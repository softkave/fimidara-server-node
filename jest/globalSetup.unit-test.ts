import {getMongoConnection} from '../src/db/connection';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getLogicProviders,
} from '../src/endpoints/contexts/BaseContext';
import MemoryDataProviderContext from '../src/endpoints/contexts/MemoryDataProviderContext';
import {setupApp} from '../src/endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../src/endpoints/test-utils/context/NoopEmailProviderContext';
import NoopFilePersistenceProviderContext from '../src/endpoints/test-utils/context/NoopFilePersistenceProviderContext';
import {getTestVars} from '../src/endpoints/test-utils/vars';

async function testGlobalSetup() {
  const appVariables = getTestVars();
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const ctx = new BaseContext(
    new MemoryDataProviderContext(),
    new NoopEmailProviderContext(),
    new NoopFilePersistenceProviderContext(),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders()
  );

  await setupApp(ctx);
}

module.exports = testGlobalSetup;

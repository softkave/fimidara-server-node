import {globalSetup} from '../endpoints/contexts/globalUtils';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function integrationTestGlobalSetup() {
  await globalSetup();
  await setupApp();
}

module.exports = integrationTestGlobalSetup;

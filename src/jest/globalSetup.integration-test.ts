import {registerInjectables} from '../endpoints/contexts/injection/register';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function integrationTestGlobalSetup() {
  registerInjectables();
  await setupApp();
}

module.exports = integrationTestGlobalSetup;

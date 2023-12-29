import {setupApp} from '../endpoints/runtime/initAppSetup';

async function integrationTestGlobalSetup() {
  await setupApp();
}

module.exports = integrationTestGlobalSetup;

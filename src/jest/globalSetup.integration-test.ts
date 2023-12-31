import 'reflect-metadata';
import {registerInjectables} from '../endpoints/contexts/injectables';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function integrationTestGlobalSetup() {
  registerInjectables();
  await setupApp();
}

module.exports = integrationTestGlobalSetup;

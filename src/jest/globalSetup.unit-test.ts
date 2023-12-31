import 'reflect-metadata';
import {registerInjectables} from '../endpoints/contexts/injectables';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function testGlobalSetup() {
  registerInjectables();
  await setupApp();
}

module.exports = testGlobalSetup;

import {registerInjectables} from '../endpoints/contexts/injection/register';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function testGlobalSetup() {
  registerInjectables();
  await setupApp();
}

module.exports = testGlobalSetup;

import {globalSetup} from '../endpoints/contexts/globalUtils';
import {setupApp} from '../endpoints/runtime/initAppSetup';

async function testGlobalSetup() {
  await globalSetup();
  await setupApp();
}

module.exports = testGlobalSetup;

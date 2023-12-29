import {setupApp} from '../endpoints/runtime/initAppSetup';

async function testGlobalSetup() {
  await setupApp();
}

module.exports = testGlobalSetup;

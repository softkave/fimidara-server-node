import {globalSetup} from '../endpoints/contexts/globalUtils';
import {initFimidara} from '../endpoints/runtime/initFimidara';

async function integrationTestGlobalSetup() {
  await globalSetup({startApp: false, startPool: false});
  await initFimidara();
}

module.exports = integrationTestGlobalSetup;

import {globalSetup} from '../endpoints/contexts/globalUtils';
import {initFimidara} from '../endpoints/runtime/initFimidara';

async function integrationTestGlobalSetup() {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
  await initFimidara();
}

module.exports = integrationTestGlobalSetup;

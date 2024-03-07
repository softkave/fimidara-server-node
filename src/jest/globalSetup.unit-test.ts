import {globalSetup} from '../endpoints/contexts/globalUtils';
import {initFimidara} from '../endpoints/runtime/initFimidara';

async function testGlobalSetup() {
  await globalSetup();
  await initFimidara();
}

module.exports = testGlobalSetup;

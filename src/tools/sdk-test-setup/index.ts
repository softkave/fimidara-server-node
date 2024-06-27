import {
  globalDispose,
  globalSetup,
} from '../../endpoints/contexts/globalUtils.js';
import {setupSDKTestReq} from './utils.js';

async function main() {
  await globalSetup({useFimidaraApp: false, useFimidaraWorkerPool: false});
  await setupSDKTestReq();
  await globalDispose();
}

main();

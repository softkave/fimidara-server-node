import {globalDispose, globalSetup} from '../../endpoints/contexts/globalUtils';
import {setupSDKTestReq} from './utils';

async function main() {
  await globalSetup({startApp: false, startPool: false});
  await setupSDKTestReq();
  await globalDispose();
}

main();

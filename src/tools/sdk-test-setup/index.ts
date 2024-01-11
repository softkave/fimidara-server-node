import {globalDispose, globalSetup} from '../../endpoints/contexts/globalUtils';
import {setupSDKTestReq} from './utils';

async function main() {
  await globalSetup();
  await setupSDKTestReq();
  await globalDispose();
}

main();

import {globalDispose, globalSetup} from '../../contexts/globalUtils.js';
import {setupSDKTestReq} from './utils.js';

async function main() {
  await globalSetup(
    {useFimidaraApp: false, useFimidaraWorkerPool: false},
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
    }
  );
  await setupSDKTestReq();
  await globalDispose();
}

main();

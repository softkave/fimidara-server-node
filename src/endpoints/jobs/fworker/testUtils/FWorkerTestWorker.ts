import {isNumber} from 'lodash-es';
import {isMainThread} from 'worker_threads';
import {globalSetup} from '../../../../contexts/globalUtils.js';
import {FWorker} from '../FWorker.js';
import {FWorkerMessager} from '../FWorkerMessager.js';
import {kFWorkerTestWorkerTerminateMessage} from './constants.js';

async function main() {
  await globalSetup(
    {useFimidaraApp: false, useFimidaraWorkerPool: false},
    {
      useHandleFolderQueue: false,
      useHandleUsageRecordQueue: false,
      useHandleAddInternalMultipartIdQueue: false,
      useHandlePrepareFileQueue: false,
    }
  );
  const fworker = new FWorker();

  fworker.getPort().on('message', message => {
    fworker.postTrackedMessage({
      outgoingPort: fworker.getPort(),
      value: message,
    });

    if (
      (isNumber(message) && message === kFWorkerTestWorkerTerminateMessage) ||
      (FWorkerMessager.isWorkerTrackedMessage(message) &&
        message.value === kFWorkerTestWorkerTerminateMessage)
    ) {
      // terminate() should end the thread so it acts a globalDispose() of sort
      setTimeout(() => fworker.dispose(), 0);
    }
  });

  fworker.informMainThreadWorkerIsReady();
}

if (!isMainThread) {
  main();
}

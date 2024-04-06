import {isNumber} from 'lodash';
import {isMainThread} from 'worker_threads';
import {globalSetup} from '../../../contexts/globalUtils';
import {FWorker} from '../FWorker';
import {FWorkerMessager} from '../FWorkerMessager';

export const kFWorkerTestWorkerTerminateMessage = 12;

async function main() {
  await globalSetup();
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

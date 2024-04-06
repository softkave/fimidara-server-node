import {isMainThread} from 'worker_threads';
import {globalSetup} from '../../contexts/globalUtils';
import {FimidaraWorker} from './FimidaraWorker';

async function main() {
  await globalSetup();
  const fimidaraWorker = new FimidaraWorker();
  fimidaraWorker.start();
}

if (!isMainThread) {
  main();
}

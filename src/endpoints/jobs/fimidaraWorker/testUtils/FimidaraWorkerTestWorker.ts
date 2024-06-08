import {isMainThread} from 'worker_threads';
import {FimidaraWorker} from '../FimidaraWorker.js';

async function main() {
  const fimidaraWorker = new FimidaraWorker();
  fimidaraWorker.start();
}

if (!isMainThread) {
  main();
}

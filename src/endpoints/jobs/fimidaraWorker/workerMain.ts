import {isMainThread} from 'worker_threads';
import {FimidaraWorker} from './FimidaraWorker.js';

async function main() {
  const fimidaraWorker = new FimidaraWorker();
  await fimidaraWorker.start();
}

if (!isMainThread) {
  main().catch(console.error.bind(console));
}

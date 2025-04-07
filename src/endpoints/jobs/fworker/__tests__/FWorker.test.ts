import {faker} from '@faker-js/faker';
import assert from 'assert';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {MessageChannel, Worker} from 'worker_threads';
import {awaitOrTimeout} from '../../../../utils/promiseFns.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {FWorker, FWorkerData, kFWorkerMessageType} from '../FWorker.js';
import {FWorkerMain} from '../FWorkerMain.js';
import {FWorkerMessager} from '../FWorkerMessager.js';
import {kFWorkerTestWorkerTerminateMessage} from '../testUtils/constants.js';

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fworker/testUtils/FWorkerTestWorker.js';
let worker: Worker;

beforeAll(async () => {
  await initTests();
});

afterEach(async () => {
  await worker.terminate();
});

afterAll(async () => {
  await completeTests();
});

describe('FWorker', () => {
  test('postTrackedMessage', async () => {
    const {port1: parentPort, port2: workerPort} = new MessageChannel();
    const wData: FWorkerData = {port: workerPort, workerId: '1'};

    worker = new Worker(kWorkerTestFilepath, {
      workerData: wData,
      transferList: [wData.port],
    });
    worker.on('message', console.log.bind(console));
    worker.on('error', console.log.bind(console));
    worker.on('messageerror', console.log.bind(console));

    const messager = new FWorkerMessager();
    const value = faker.number.int();
    await FWorkerMain.awaitWorkerOnline(worker);
    const response = await messager.postTrackedMessage({
      value,
      outgoingPort: parentPort,
      incomingPort: parentPort,
      expectAck: true,
      ackTimeoutMs: 1_000,
    });

    assert(FWorkerMessager.isWorkerTrackedMessage(response));
    expect(response.value).toBe(value);
  });

  test('terminate', async () => {
    const {port1: parentPort, port2: workerPort} = new MessageChannel();
    const wData: FWorkerData = {port: workerPort, workerId: '2'};
    const onTerminateFn = vi.fn();
    worker = new Worker(kWorkerTestFilepath, {
      workerData: wData,
      transferList: [wData.port],
    });
    worker.on('exit', onTerminateFn);
    worker.on('message', console.log.bind(console));
    worker.on('error', console.log.bind(console));
    worker.on('messageerror', console.log.bind(console));

    const messager = new FWorkerMessager();
    await FWorkerMain.awaitWorkerOnline(worker);
    messager.postTrackedMessage({
      value: kFWorkerTestWorkerTerminateMessage,
      outgoingPort: parentPort,
    });

    await FWorkerMain.awaitWorkerExit(worker);
    expect(onTerminateFn).toHaveBeenCalled();
  });

  test('inform main thread on worker ready', async () => {
    const {port1: parentPort, port2: workerPort} = new MessageChannel();
    const workerReadyPromise = new Promise<void>(resolve => {
      parentPort.on('message', (message: unknown) => {
        if (
          FWorkerMessager.isWorkerTrackedMessage(message) &&
          FWorker.isFWorkerMessage(message.value) &&
          message.value.type === kFWorkerMessageType.workerReady
        ) {
          resolve();
        }
      });
    });
    const wData: FWorkerData = {port: workerPort, workerId: '3'};
    const onTerminateFn = vi.fn();

    worker = new Worker(kWorkerTestFilepath, {
      workerData: wData,
      transferList: [wData.port],
    });
    worker.on('exit', onTerminateFn);
    worker.on('message', console.log.bind(console));
    worker.on('error', console.log.bind(console));
    worker.on('messageerror', console.log.bind(console));

    await FWorkerMain.awaitWorkerOnline(worker);
    await awaitOrTimeout(workerReadyPromise, /** timeout, 10 seconds */ 10_000);
  });
});

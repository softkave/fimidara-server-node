import assert from 'assert';
import {map} from 'lodash-es';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import {kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {waitTimeout} from '../../../../utils/fns.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {FWorkerMain} from '../FWorkerMain.js';
import {FWorkerMessager} from '../FWorkerMessager.js';

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fworker/testUtils/FWorkerTestWorker.js';
let workerMain: FWorkerMain;

beforeAll(async () => {
  await initTests();
});

afterEach(async () => {
  await workerMain.dispose();
});

afterAll(async () => {
  await completeTests();
});

describe('FWorkerMain', () => {
  test('startNewWorker', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});

    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1'),
      workerMain.startNewWorker(kWorkerTestFilepath, '2'),
    ]);

    const workers = workerMain.getWorkers();
    expect(Object.keys(workers)).toEqual(['1', '2']);
  });

  test('terminate', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});

    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1'),
      workerMain.startNewWorker(kWorkerTestFilepath, '2'),
    ]);

    let workers = workerMain.getWorkers();
    expect(Object.keys(workers)).toEqual(['1', '2']);

    await workerMain.dispose();

    workers = workerMain.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
  });

  test('graceful terminate', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});
    const gracefulTerminateFn = vi.fn();

    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1', gracefulTerminateFn),
    ]);

    let workers = workerMain.getWorkers();
    expect(Object.keys(workers)).toEqual(['1']);

    await workerMain.dispose();

    workers = workerMain.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
    expect(gracefulTerminateFn).toHaveBeenCalled();
  });

  test('graceful terminate timeout', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});
    const gracefulTerminateTimeoutMs = 20;
    const gracefulTerminateFn = vi.fn().mockImplementation(async () => {
      await waitTimeout(gracefulTerminateTimeoutMs * 3);
    });

    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1', gracefulTerminateFn),
    ]);

    let workers = workerMain.getWorkers();
    expect(Object.keys(workers)).toEqual(['1']);

    const beforeTerminateTimestamp = Date.now();
    await workerMain.dispose(gracefulTerminateTimeoutMs);
    const afterTerminateTimestamp = Date.now();

    workers = workerMain.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
    expect(gracefulTerminateFn).toHaveBeenCalled();
    expect(afterTerminateTimestamp - beforeTerminateTimestamp).toBeLessThan(
      gracefulTerminateTimeoutMs * 2
    );
  });

  test('stopWorker', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});

    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1'),
      workerMain.startNewWorker(kWorkerTestFilepath, '2'),
    ]);

    let workers = workerMain.getWorkers();
    expect(Object.keys(workers)).toEqual(['1', '2']);

    await workerMain.stopWorker('1');

    workers = workerMain.getWorkers();
    expect(Object.keys(workers).length).toEqual(1);
  });

  test('message worker', async () => {
    workerMain = new FWorkerMain({promises: kIjxUtils.promises()});
    await Promise.all([
      workerMain.startNewWorker(kWorkerTestFilepath, '1'),
      workerMain.startNewWorker(kWorkerTestFilepath, '2'),
    ]);

    const value = 1;
    const workers = workerMain.getWorkers();
    const responses = await Promise.all(
      map(workers, async wEntry => {
        return wEntry
          ? await workerMain.postTrackedMessage({
              value,
              outgoingPort: wEntry.port,
              incomingPort: wEntry.port,
              expectAck: true,
              ackTimeoutMs: 1_000,
            })
          : undefined;
      })
    );
    responses.forEach(response => {
      assert(FWorkerMessager.isWorkerTrackedMessage(response));
      expect(response.value).toBe(value);
    });
  });
});

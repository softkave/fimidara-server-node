import assert from 'assert';
import {map} from 'lodash';
import {waitTimeout} from '../../../../utils/fns';
import {kUtilsInjectables} from '../../../contexts/injection/injectables';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {FWorkerMessager} from '../FWorkerMessager';
import {FWorkerPool} from '../FWorkerPool';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fworker/testUtils/FWorkerTestWorker.js';

describe('FWorkerPool', () => {
  test('ensureWorkerCount', async () => {
    let workerId = 0;
    const workerPool = new FWorkerPool({
      promises: kUtilsInjectables.promises(),
      filepath: kWorkerTestFilepath,
      workerCount: 2,
      generateWorkerId: () => {
        return (++workerId).toString();
      },
    });

    await workerPool.ensureWorkerCount();
    const workers = workerPool.getWorkers();
    expect(Object.keys(workers)).toEqual(
      Array(workerId)
        .fill(0)
        .map((unused, index) => (index + 1).toString())
    );

    await workerPool.dispose();
  });

  test('terminate', async () => {
    let workerId = 1;
    const workerPool = new FWorkerPool({
      promises: kUtilsInjectables.promises(),
      filepath: kWorkerTestFilepath,
      workerCount: 2,
      generateWorkerId: () => {
        return (workerId++).toString();
      },
    });

    await workerPool.ensureWorkerCount();
    let workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBeGreaterThan(0);

    await workerPool.dispose();
    workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
  });

  test('graceful terminate', async () => {
    let workerId = 1;
    const gracefulTerminateFn = jest.fn();
    const workerPool = new FWorkerPool({
      gracefulTerminateFn,
      promises: kUtilsInjectables.promises(),
      filepath: kWorkerTestFilepath,
      workerCount: 2,
      generateWorkerId: () => {
        return (workerId++).toString();
      },
    });

    await workerPool.ensureWorkerCount();
    let workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBeGreaterThan(0);

    await workerPool.dispose();
    workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
    expect(gracefulTerminateFn).toHaveBeenCalledTimes(2);
  });

  test('graceful terminate timeout', async () => {
    let workerId = 1;
    const gracefulTerminateTimeoutMs = 30;
    const gracefulTerminateFn = jest.fn().mockImplementation(async () => {
      await waitTimeout(gracefulTerminateTimeoutMs * 3);
    });
    const workerPool = new FWorkerPool({
      gracefulTerminateFn,
      gracefulTerminateTimeoutMs,
      promises: kUtilsInjectables.promises(),
      filepath: kWorkerTestFilepath,
      workerCount: 2,
      generateWorkerId: () => {
        return (workerId++).toString();
      },
    });

    await workerPool.ensureWorkerCount();
    let workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBeGreaterThan(0);

    const beforeTerminateTimestamp = Date.now();
    await workerPool.dispose();
    const afterTerminateTimestamp = Date.now();
    workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBe(0);
    expect(gracefulTerminateFn).toHaveBeenCalledTimes(2);
    expect(afterTerminateTimestamp - beforeTerminateTimestamp).toBeLessThan(
      gracefulTerminateTimeoutMs * 2
    );
  });

  test('message worker', async () => {
    let workerId = 1;
    const workerPool = new FWorkerPool({
      promises: kUtilsInjectables.promises(),
      filepath: kWorkerTestFilepath,
      workerCount: 2,
      generateWorkerId: () => {
        return (workerId++).toString();
      },
    });

    await workerPool.ensureWorkerCount();
    const workers = workerPool.getWorkers();
    expect(Object.keys(workers).length).toBeGreaterThan(0);
    const value = 1;
    const responses = await Promise.all(
      map(workers, async wEntry => {
        return wEntry
          ? await workerPool.postTrackedMessage({
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

    await workerPool.dispose();
  });
});

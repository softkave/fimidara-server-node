import assert from 'assert';
import {map} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {waitTimeout} from '../../../../utils/fns.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {FWorkerMessager} from '../FWorkerMessager.js';
import {FWorkerPool} from '../FWorkerPool.js';

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
      promises: kIjxUtils.promises(),
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
      promises: kIjxUtils.promises(),
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
    const gracefulTerminateFn = vi.fn();
    const workerPool = new FWorkerPool({
      gracefulTerminateFn,
      promises: kIjxUtils.promises(),
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
    const gracefulTerminateFn = vi.fn().mockImplementation(async () => {
      await waitTimeout(gracefulTerminateTimeoutMs * 3);
    });
    const workerPool = new FWorkerPool({
      gracefulTerminateFn,
      gracefulTerminateTimeoutMs,
      promises: kIjxUtils.promises(),
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
      promises: kIjxUtils.promises(),
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

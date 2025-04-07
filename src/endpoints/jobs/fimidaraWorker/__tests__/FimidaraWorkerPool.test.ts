import {afterAll, afterEach, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../contexts/ijx/register.js';
import {kAppType} from '../../../../definitions/app.js';
import {Job, kJobStatus, kJobType} from '../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {getNewId, getNewIdForResource} from '../../../../utils/resource.js';
import {FimidaraApp} from '../../../app/FimidaraApp.js';
import {generateAndInsertJobListForTest} from '../../../testHelpers/generate/job.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {waitForJob} from '../../waitForJob.js';
import {FimidaraWorkerPool} from '../FimidaraWorkerPool.js';

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fimidaraWorker/testUtils/FimidaraWorkerTestWorker.js';
let pool: FimidaraWorkerPool | undefined;
let server: FimidaraApp | undefined;

beforeAll(async () => {
  await initTests();

  const conf = kIjxUtils.suppliedConfig();
  kRegisterIjxUtils.suppliedConfig({
    ...conf,
    runnerLocation: kWorkerTestFilepath,
  });
});

afterEach(async () => {
  await pool?.dispose();
  await server?.dispose();
});

afterAll(async () => {
  await completeTests();
});

class TestFimidaraWorkerPool extends FimidaraWorkerPool {
  async expectNextJob(expectedJob: Job, workerId: string) {
    const job = await this.getNextJob(workerId);
    expect(expectedJob.resourceId).toBe(job?.resourceId);
  }
}

describe('FimidaraWorkerPool', () => {
  test('getNextJob', async () => {
    const shard = getNewId();
    server = new FimidaraApp({
      shard,
      appId: getNewIdForResource(kFimidaraResourceType.App),
      type: kAppType.server,
    });
    await server.startApp();
    const testPool = (pool = new TestFimidaraWorkerPool({
      server,
      workerCount: 0,
    }));
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    const workerId = getNewIdForResource(kFimidaraResourceType.Job);
    await testPool.expectNextJob(job, workerId);

    const dbJob = await kIjxSemantic.job().getOneById(job.resourceId);
    expect(dbJob?.runnerId).toBe(workerId);
  });

  test('graceful terminate', async () => {
    const shard = getNewId();
    server = new FimidaraApp({
      shard,
      appId: getNewIdForResource(kFimidaraResourceType.App),
      type: kAppType.server,
    });
    await server.startApp();
    const testPool = new TestFimidaraWorkerPool({
      server,
      workerCount: 1,
      gracefulTerminateTimeoutMs: 10_000, // 10 seconds
    });

    await testPool.startPool();

    await testPool.dispose();
  });

  test('startPool', async () => {
    const shard = getNewId();
    server = new FimidaraApp({
      shard,
      appId: getNewIdForResource(kFimidaraResourceType.App),
      type: kAppType.server,
    });
    await server.startApp();
    pool = new FimidaraWorkerPool({server});
    const jobs = await generateAndInsertJobListForTest(/** count */ 5, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    await pool.startPool();
    await Promise.all(
      jobs.map(job =>
        waitForJob(
          job.resourceId,
          /** bump priority */ true,
          /** wait for 10 seconds */ 10_000
        )
      )
    );
  });
});

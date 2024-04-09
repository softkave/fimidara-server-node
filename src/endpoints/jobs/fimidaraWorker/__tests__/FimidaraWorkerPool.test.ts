import {kAppType} from '../../../../definitions/app';
import {Job, kJobStatus, kJobType} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {getNewId, getNewIdForResource} from '../../../../utils/resource';
import {FimidaraApp} from '../../../app/FimidaraApp';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register';
import {generateAndInsertJobListForTest} from '../../../testUtils/generate/job';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {waitForJob} from '../../waitForJob';
import {FimidaraWorkerPool} from '../FimidaraWorkerPool';

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fimidaraWorker/testUtils/FimidaraWorkerTestWorker.js';
let pool: FimidaraWorkerPool | undefined;
let server: FimidaraApp | undefined;

beforeAll(async () => {
  await initTests();

  const conf = kUtilsInjectables.suppliedConfig();
  kRegisterUtilsInjectables.suppliedConfig({
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
    const testPool = (pool = new TestFimidaraWorkerPool({server, workerCount: 0}));
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    const workerId = getNewIdForResource(kFimidaraResourceType.Job);
    await testPool.expectNextJob(job, workerId);

    const dbJob = await kSemanticModels.job().getOneById(job.resourceId);
    expect(dbJob?.runnerId).toBe(workerId);
  });

  test.only('graceful terminate', async () => {
    const shard = getNewId();
    server = new FimidaraApp({
      shard,
      appId: getNewIdForResource(kFimidaraResourceType.App),
      type: kAppType.server,
    });
    await server.startApp();
    const testPool = new TestFimidaraWorkerPool({server, workerCount: 1});

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

    console.log('complete');
  });
});

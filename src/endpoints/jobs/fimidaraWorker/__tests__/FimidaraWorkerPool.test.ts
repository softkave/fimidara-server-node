import {kAppType} from '../../../../definitions/app';
import {kJobStatus, kJobType} from '../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {getNewId, getNewIdForResource} from '../../../../utils/resource';
import {FimidaraApp} from '../../../app/FimidaraApp';
import {kUtilsInjectables} from '../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register';
import {generateAndInsertJobListForTest} from '../../../testUtils/generate/job';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {waitForJob} from '../../waitForJob';
import {FimidaraWorkerPool} from '../FimidaraWorkerPool';

const kWorkerTestFilepath =
  './build/src/endpoints/jobs/fimidaraWorker/testUtils/FimidaraWorkerTestWorker.ts';

beforeAll(async () => {
  await initTests();

  const conf = kUtilsInjectables.suppliedConfig();
  kRegisterUtilsInjectables.suppliedConfig({
    ...conf,
    runnerLocation: kWorkerTestFilepath,
  });
});

afterAll(async () => {
  await completeTests();
});

describe('FimidaraWorkerPool', () => {
  test('startPool', async () => {
    const shard = getNewId();
    const server = new FimidaraApp({
      shard,
      appId: getNewIdForResource(kFimidaraResourceType.App),
      type: kAppType.server,
    });
    const pool = new FimidaraWorkerPool({server});
    const jobs = await generateAndInsertJobListForTest(/** count */ 5, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    await pool.startPool();
    await Promise.all(
      jobs.map(job =>
        waitForJob(job.resourceId, /** bump priority */ true, /** wait for 10s */ 10_000)
      )
    );

    await pool.dispose();
  });
});

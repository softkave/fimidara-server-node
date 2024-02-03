import assert from 'assert';
import {first, map} from 'lodash';
import {kAppPresetShards, kAppType} from '../../../definitions/app';
import {kJobStatus, kJobType} from '../../../definitions/job';
import {getTimestamp} from '../../../utils/dateFns';
import {extractResourceIdList, waitTimeout} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getNewId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {kRegisterSemanticModels} from '../../contexts/injection/register';
import {generateAndInsertAppListForTest} from '../../testUtils/generate/app';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {
  getActiveRunnerIds,
  getWorkers,
  messageRunner,
  setActiveRunnerHeartbeatFactor,
  setRunnerCount,
  setRunnerHeartbeatInterval,
  setRunnerPickFromShards,
  setRunnerShard,
  startRunner,
  stopRunner,
  stopWorker,
} from '../runner';
import {RunnerWorkerMessage, kRunnerWorkerMessageType} from '../types';
import {
  isRunnerWorkerMessage,
  kDefaultActiveRunnerHeartbeatFactor,
  kDefaultHeartbeatInterval,
  kDefaultRunnerCount,
  waitForJob,
} from '../utils';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await stopRunner();
  await completeTests();
});

afterEach(() => {
  // Reset runner options
  setRunnerHeartbeatInterval(kDefaultHeartbeatInterval);
  setActiveRunnerHeartbeatFactor(kDefaultActiveRunnerHeartbeatFactor);
  setRunnerCount(kDefaultRunnerCount);
  setRunnerPickFromShards([kAppPresetShards.fimidaraMain]);
  setRunnerShard(kAppPresetShards.fimidaraMain);
});

describe('runner', () => {
  test('workers start and end', async () => {
    const shard = getNewId();
    setRunnerShard(shard);
    setRunnerCount(1);
    await startRunner();

    let workers = getWorkers();
    const workerIds = Object.keys(workers);
    expect(workerIds.length).toBeGreaterThan(0);

    const runnerApps = await kSemanticModels.app().getManyByIdList(workerIds);
    expect(runnerApps.length).toBe(workerIds.length);

    await stopRunner();

    workers = getWorkers();
    expect(Object.values(workers).length).toBe(0);
  });

  test('set workers count sizes up & down workers', async () => {
    const startCount = 1;
    const shard = getNewId();
    setRunnerCount(startCount);
    setRunnerShard(shard);
    await startRunner();

    let workers = getWorkers();
    expect(Object.values(workers).length).toBe(startCount);

    const sizeUpCount = 2;
    setRunnerCount(sizeUpCount);
    await startRunner();

    workers = getWorkers();
    expect(Object.values(workers).length).toBe(sizeUpCount);

    const sizeDownCount = 1;
    setRunnerCount(sizeDownCount);
    await startRunner();

    workers = getWorkers();
    expect(Object.values(workers).length).toBe(sizeDownCount);

    await stopRunner();
  });

  test('parent active runner IDs updated', async () => {
    const startCount = 1;
    const heartbeatInterval = 100; // 100ms
    const heartbeatFactor = 10;
    const shard = getNewId();
    const otherRunners = await generateAndInsertAppListForTest(/** count */ 5, {
      shard,
      type: kAppType.runner,
      lastUpdatedAt: getTimestamp() + heartbeatInterval * heartbeatFactor,
    });

    setRunnerCount(startCount);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setActiveRunnerHeartbeatFactor(heartbeatFactor);
    setRunnerShard(shard);
    await startRunner();
    await waitTimeout(heartbeatInterval * heartbeatFactor);

    // active runners should include our filler runners seeing their heartbeat
    // should still be recent, they were added about 100ms ago
    let activeRunnerIds = getActiveRunnerIds();
    expect(activeRunnerIds).toEqual(
      expect.arrayContaining(extractResourceIdList(otherRunners))
    );

    // active runners should **not** include our filler runners seeing their
    // heartbeat is now twice older than our set heartbeat interval
    await waitTimeout(heartbeatInterval * heartbeatFactor * 2);
    activeRunnerIds = getActiveRunnerIds();
    expect(activeRunnerIds).not.toEqual(
      expect.arrayContaining(extractResourceIdList(otherRunners))
    );

    await stopRunner();
  });

  test('children active runners updated', async () => {
    const count = 2;
    const heartbeatInterval = 200; // 200ms
    const shard = getNewId();
    const heartbeatFactor = 10;

    const otherRunners = await generateAndInsertAppListForTest(/** count */ 5, {
      shard,
      type: kAppType.runner,
      lastUpdatedAt: getTimestamp() * 2,
    });

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setActiveRunnerHeartbeatFactor(heartbeatFactor);
    setRunnerShard(shard);
    await startRunner();

    await waitTimeout(heartbeatInterval * heartbeatFactor);
    const workers = getWorkers();

    await Promise.all(
      Object.values(workers).map(async worker => {
        const inMessage: RunnerWorkerMessage = {
          type: kRunnerWorkerMessageType.getActiveRunnerIds,
          runnerId: null,
        };
        const outMessage = await messageRunner(
          worker,
          inMessage,
          /** expectAck */ true,
          /** timeout ms */ 500
        );

        assert(
          isRunnerWorkerMessage(outMessage) &&
            outMessage.type === kRunnerWorkerMessageType.setActiveRunnerIds
        );
        expect(outMessage.activeRunnerIds).toEqual(
          expect.arrayContaining(extractResourceIdList(otherRunners))
        );
      })
    );

    await stopRunner();
  });

  test('heartbeat updated', async () => {
    const count = 2;
    const heartbeatInterval = 200; // 200ms
    const shard = getNewId();

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);
    await startRunner();

    const workers = getWorkers();
    let runners = await kSemanticModels.app().getManyByIdList(Object.keys(workers));
    const runnersMap = indexArray(runners, {indexer: r => r.resourceId});

    await waitTimeout(heartbeatInterval * 5);

    runners = await kSemanticModels.app().getManyByIdList(Object.keys(workers));
    runners.forEach(runner => {
      const sameRunner = runnersMap[runner.resourceId];
      expect(runner.lastUpdatedAt).toBeGreaterThan(sameRunner.lastUpdatedAt);
    });

    await stopRunner();
  });

  test.skip('dead runners restart', async () => {
    const count = 2;
    const heartbeatInterval = 50;
    const shard = getNewId();

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);

    kRegisterSemanticModels.job(() => {
      throw new Error('Fail so as to break runner!');
    });

    await startRunner();

    let workers = getWorkers();
    const startWorkerIds = Object.keys(workers);
    const worker0 = first(Object.values(workers));
    assert(worker0);
    await messageRunner<RunnerWorkerMessage>(
      worker0,
      {type: kRunnerWorkerMessageType.fail},
      /** expectAck */ false
    );

    await waitTimeout(heartbeatInterval);

    workers = getWorkers();
    const endWorkerIds = Object.keys(workers);
    expect(startWorkerIds.length).toBe(count);
    expect(endWorkerIds.length).toBe(count);
    expect(startWorkerIds).not.toEqual(expect.arrayContaining(endWorkerIds));

    await stopRunner();
  });

  test('dead runners heartbeat not updated', async () => {
    const count = 2;
    const heartbeatInterval = 200; // 200ms
    const shard = getNewId();
    const heartbeatFactor = 10;

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setActiveRunnerHeartbeatFactor(heartbeatFactor);
    setRunnerShard(shard);
    await startRunner();

    const workers = getWorkers();
    const wList = Object.keys(workers);
    const wIdList01 = wList.slice(0, count / 2);
    const wIdList02 = Object.keys(count / 2);

    await Promise.all(map(wIdList01, id => stopWorker(workers[id])));
    const deadTimestamp = getTimestamp();

    await waitTimeout(heartbeatInterval * 4);
    const [wList01, wList02] = await Promise.all([
      kSemanticModels.app().getManyByIdList(wIdList01),
      kSemanticModels.app().getManyByIdList(wIdList02),
    ]);
    wList01.forEach(runner => {
      expect(runner.lastUpdatedAt).toBeLessThan(deadTimestamp);
    });
    wList02.forEach(runner => {
      expect(runner.lastUpdatedAt).toBeGreaterThan(deadTimestamp);
    });

    await stopRunner();
  });

  test('workers run jobs', async () => {
    const count = 2;
    const shard = getNewId();
    const jobs = await generateAndInsertJobListForTest(/** count */ 5, {
      shard,
      status: kJobStatus.pending,
      type: kJobType.noop,
    });

    setRunnerCount(count);
    setRunnerShard(shard);
    setRunnerPickFromShards([shard]);
    await startRunner();

    await Promise.all(
      jobs.map(job =>
        waitForJob(job.resourceId, /** bump priority */ true, /** wait for 10s */ 10_000)
      )
    );

    await stopRunner();
  });
});

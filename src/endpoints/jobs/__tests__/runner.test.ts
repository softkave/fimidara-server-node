import assert from 'assert';
import {kAppPresetShards, kAppType} from '../../../definitions/app';
import {getTimestamp} from '../../../utils/dateFns';
import {extractResourceIdList, waitTimeout} from '../../../utils/fns';
import {getNewId} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertAppListForTest} from '../../testUtils/generate/app';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
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
} from '../runner';
import {RunnerWorkerMessage} from '../types';
import {
  isRunnerWorkerMessage,
  kDefaultActiveRunnerHeartbeatFactor,
  kDefaultHeartbeatInterval,
  kDefaultRunnerCount,
  waitForJob,
} from '../utils';

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
    await startRunner();

    let workers = getWorkers();
    const workerIds = Object.keys(workers);
    expect(workerIds).toBeGreaterThan(0);

    const runnerApps = await kSemanticModels.app().getManyByIdList(workerIds);
    expect(runnerApps.length).toBe(workerIds.length);

    await stopRunner();

    workers = getWorkers();
    expect(Object.values(workers)).toBe(0);
  });

  test('set workers count sizes up & down workers', async () => {
    const startCount = 1;
    const shard = getNewId();
    setRunnerCount(startCount);
    setRunnerShard(shard);
    await startRunner();

    let workers = getWorkers();
    expect(Object.values(workers)).toBe(startCount);

    const sizeUpCount = 2;
    await setRunnerCount(sizeUpCount, /** ensure count */ true);

    workers = getWorkers();
    expect(Object.values(workers)).toBe(sizeUpCount);

    const sizeDownCount = 1;
    await setRunnerCount(sizeDownCount, /** ensure count */ true);

    workers = getWorkers();
    expect(Object.values(workers)).toBe(sizeDownCount);

    await stopRunner();
  });

  test('parent active runner IDs updated', async () => {
    const startCount = 1;
    const heartbeatInterval = 50; // 50ms
    const heartbeatFactor = 2;
    const shard = getNewId();
    const fillerRunners = await generateAndInsertAppListForTest(/** count */ 5, {
      shard,
      type: kAppType.runner,
    });

    setRunnerCount(startCount);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setActiveRunnerHeartbeatFactor(heartbeatFactor);
    setRunnerShard(shard);
    await startRunner();
    await waitTimeout(heartbeatInterval + 1);

    // active runners should include our filler runners seeing their heartbeat
    // should still be recent, they were added about 50ms ago
    let activeRunnerIds = getActiveRunnerIds();
    expect(activeRunnerIds).toEqual(
      expect.arrayContaining(extractResourceIdList(fillerRunners))
    );

    // active runners should **not** include our filler runners seeing their
    // heartbeat is now twice older than our set heartbeat interval
    await waitTimeout(heartbeatInterval + 1);
    activeRunnerIds = getActiveRunnerIds();
    expect(activeRunnerIds).not.toEqual(
      expect.arrayContaining(extractResourceIdList(fillerRunners))
    );

    await stopRunner();
  });

  test('children active runners updated', async () => {
    const count = 2;
    const heartbeatInterval = 50;
    const shard = getNewId();

    const fillerRunners = await generateAndInsertAppListForTest(/** count */ 5, {
      type: kAppType.runner,
    });

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);
    await startRunner();

    await waitTimeout(heartbeatInterval);
    const workers = getWorkers();

    await Promise.all(
      Object.values(workers).map(async worker => {
        const inMessage: RunnerWorkerMessage = {
          type: 'getActiveRunnerIds',
          runnerId: null,
        };
        const outMessage = await messageRunner(
          worker,
          inMessage,
          /** expectAck */ true,
          /** timeout ms */ 500
        );

        assert(
          isRunnerWorkerMessage(outMessage) && outMessage.type === 'setActiveRunnerIds'
        );
        expect(outMessage.activeRunnerIds).toEqual(
          expect.arrayContaining(extractResourceIdList(fillerRunners))
        );
      })
    );

    await stopRunner();
  });

  test('heartbeat updated', async () => {
    const count = 2;
    const heartbeatInterval = 50;
    const shard = getNewId();

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);
    await startRunner();

    const pastHeartbeatTimestamp = getTimestamp();
    await waitTimeout(heartbeatInterval);
    const workers = getWorkers();

    const runnerWorkers = await kSemanticModels
      .app()
      .getManyByIdList(Object.keys(workers));

    runnerWorkers.forEach(nextRunner => {
      expect(nextRunner.lastUpdatedAt).toBeGreaterThan(pastHeartbeatTimestamp);
    });

    await stopRunner();
  });

  test('dead runners restart', async () => {
    const count = 2;
    const heartbeatInterval = 50;
    const shard = getNewId();

    const jobs = await generateAndInsertJobListForTest(/** count */ 2, {
      shard,
      status: 'pending',
      type: 'fail',
    });

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);
    await startRunner();

    let workers = getWorkers();
    const startWorkerIds = Object.keys(workers);

    await waitTimeout(heartbeatInterval);
    await Promise.all(
      jobs.map(job => waitForJob(job.resourceId, /** bump priority */ true))
    );

    workers = getWorkers();
    const endWorkerIds = Object.values(workers);
    expect(Object.values(workers).length).toBe(count);
    expect(startWorkerIds).not.toEqual(expect.arrayContaining(endWorkerIds));

    await stopRunner();
  });

  test('dead runners heartbeat not updated', async () => {
    const count = 2;
    const heartbeatInterval = 20;
    const shard = getNewId();

    const jobs = await generateAndInsertJobListForTest(/** count */ 2, {
      shard,
      status: 'pending',
      type: 'fail',
    });

    setRunnerCount(count);
    setRunnerHeartbeatInterval(heartbeatInterval);
    setRunnerShard(shard);
    await startRunner();

    const workers = getWorkers();
    const startWorkerIds = Object.keys(workers);

    const deadTimestamp = getTimestamp();
    await waitTimeout(heartbeatInterval * 3);
    await Promise.all(
      jobs.map(job => waitForJob(job.resourceId, /** bump priority */ true))
    );

    const runnerWorkers = await kSemanticModels.app().getManyByIdList(startWorkerIds);
    runnerWorkers.forEach(nextRunner => {
      expect(nextRunner.lastUpdatedAt).toBeLessThan(deadTimestamp);
    });

    await stopRunner();
  });

  test('workers run jobs', async () => {
    const count = 2;
    const shard = getNewId();

    const jobs = await generateAndInsertJobListForTest(/** count */ 10, {
      shard,
      status: 'pending',
      type: 'noop',
    });

    setRunnerCount(count);
    setRunnerShard(shard);
    await startRunner();

    // Wait for 5 secs and fail if jobs are not run. That should be enough
    // seeing we're only running noop jobs
    const timeoutHandle = setTimeout(
      () => assert.fail(new Error('Wait timeout')),
      /** 5 secs */ 5_000
    );

    await Promise.all(
      jobs.map(job => waitForJob(job.resourceId, /** bump priority */ true))
    );

    clearTimeout(timeoutHandle);
    await stopRunner();
  });
});

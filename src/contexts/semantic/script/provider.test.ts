import {
  awaitOrTimeout,
  getDeferredPromise,
  getNewId,
  waitTimeout,
} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {kJobStatus} from '../../../definitions/job.js';
import {generateAndInsertAppListForTest} from '../../../endpoints/testHelpers/generate/app.js';
import {generateAndInsertAppScriptListForTest} from '../../../endpoints/testHelpers/generate/script.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {kIjxSemantic, kIjxUtils} from '../../ijx/injectables.js';
import {SemanticScriptStatus} from './types.js';

const kHeartbeatIntervalMs = 100;
const kActiveAppHeartbeatDelayFactor = 1;

beforeAll(async () => {
  await initTests({
    useFimidaraApp: true,
    heartbeatIntervalMs: kHeartbeatIntervalMs,
    activeAppHeartbeatDelayFactor: kActiveAppHeartbeatDelayFactor,
  });
});

afterAll(async () => {
  await completeTests();
});

describe('SemanticScriptProvider', () => {
  test('should be able to start a script', async () => {
    const scriptProvider = kIjxSemantic.script();
    const name = 'test-script' + getNewId();
    const result = await scriptProvider.tryStartScript({name});

    expect(result.inserted).toBe(true);
    expect(result.script).toBeDefined();
    expect(result.script.name).toBe(name);

    const appId = kIjxUtils.serverApp().getAppId();
    const dbScript = await kIjxSemantic.script().getScript({name});
    expect(dbScript).toBeDefined();
    expect(dbScript?.name).toBe(name);
    expect(dbScript?.appId).toBe(appId);
  });

  test('it should return script id if unique script already exists', async () => {
    const scriptProvider = kIjxSemantic.script();
    const name = 'test-script' + getNewId();
    const result = await scriptProvider.tryStartScript({name});

    expect(result.inserted).toBe(true);

    const result2 = await scriptProvider.tryStartScript({
      name,
      uniqueId: result.script.uniqueId,
    });

    expect(result2.inserted).toBe(false);
    expect(result2.script).toBeDefined();
    expect(result2.script.name).toBe(name);
  });

  test('should be able to poll a script', async () => {
    const scriptProvider = kIjxSemantic.script();
    const name = 'test-script' + getNewId();
    const result = await scriptProvider.tryStartScript({name});

    expect(result.inserted).toBe(true);

    const deferred = getDeferredPromise();
    const pollCb = vi
      .fn()
      .mockImplementation((status: SemanticScriptStatus) => {
        expect([kJobStatus.pending, kJobStatus.completed]).toContain(
          status.status
        );

        if (status.status === kJobStatus.completed) {
          deferred.resolve();
        }
      });

    await scriptProvider.pollScriptStatus({
      scriptId: result.script.resourceId,
      intervalMs: 100,
      cb: pollCb,
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      return await scriptProvider.endScript(
        {
          scriptId: result.script.resourceId,
          status: kJobStatus.completed,
        },
        opts
      );
    });

    await awaitOrTimeout(deferred.promise, 150);

    // clear the mock to ensure the next assertion is correct
    pollCb.mockClear();

    // wait for our specified interval to pass
    await waitTimeout(110);

    // assert that the callback was not called because the script is completed
    expect(pollCb).not.toHaveBeenCalled();
  });

  test('should stop polling when stop is called ', async () => {
    const scriptProvider = kIjxSemantic.script();
    const name = 'test-script' + getNewId();
    const result = await scriptProvider.tryStartScript({name});

    const pollCb = vi.fn();
    const pollResult = await scriptProvider.pollScriptStatus({
      scriptId: result.script.resourceId,
      intervalMs: 100,
      cb: pollCb,
    });

    pollResult.stop();
    pollCb.mockClear();

    // wait for our specified interval to pass
    await waitTimeout(110);

    // assert that the callback was not called because we stopped polling
    expect(pollCb).not.toHaveBeenCalled();
  });

  test('should be able to end a script', async () => {
    const scriptProvider = kIjxSemantic.script();
    const [script] = await generateAndInsertAppScriptListForTest(1, {
      name: 'test-script' + getNewId(),
      status: kJobStatus.pending,
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      return await scriptProvider.endScript(
        {
          scriptId: script.resourceId,
          status: kJobStatus.completed,
        },
        opts
      );
    });

    const script2 = await scriptProvider.getScript({
      name: script.name,
    });
    expect(script2?.status).toBe(kJobStatus.completed);
    expect(script2?.statusLastUpdatedAt).toBeGreaterThan(
      script.statusLastUpdatedAt
    );
  });

  test('should be able to get a script', async () => {
    const scriptProvider = kIjxSemantic.script();
    const [script] = await generateAndInsertAppScriptListForTest(1, {
      name: 'test-script' + getNewId(),
      status: kJobStatus.pending,
    });

    const script2 = await scriptProvider.getScript({
      name: script.name,
    });
    expect(script2?.resourceId).toBe(script.resourceId);
  });

  test('should be able to get a script status', async () => {
    const scriptProvider = kIjxSemantic.script();
    const [app] = await generateAndInsertAppListForTest(1, {
      lastUpdatedAt: getTimestamp() + kHeartbeatIntervalMs * 10,
    });
    const [script] = await generateAndInsertAppScriptListForTest(1, {
      name: 'test-script' + getNewId(),
      status: kJobStatus.pending,
      appId: app.resourceId,
    });

    await waitTimeout(kHeartbeatIntervalMs * 1.25);
    const status = await scriptProvider.getScriptStatus(script.resourceId);
    expect(status.status).toBe(kJobStatus.pending);
    expect(status.isRunnerHeartbeatStale).toBe(false);

    const newLastUpdatedAt = getTimestamp() - kHeartbeatIntervalMs * 10;
    await kIjxSemantic.utils().withTxn(async opts => {
      await kIjxSemantic.app().updateOneById(
        app.resourceId,
        {
          lastUpdatedAt: newLastUpdatedAt,
        },
        opts
      );
    });

    await waitTimeout(kHeartbeatIntervalMs * 1.25);

    const status2 = await scriptProvider.getScriptStatus(script.resourceId);
    expect(status2.status).toBe(kJobStatus.pending);
    expect(status2.isRunnerHeartbeatStale).toBe(true);
  });

  test('should be able to delete failed scripts', async () => {
    const scriptProvider = kIjxSemantic.script();
    const scripts = await generateAndInsertAppScriptListForTest(5, {
      name: 'test-script' + getNewId(),
      status: kJobStatus.failed,
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      await scriptProvider.deleteFailedScripts(opts);
    });

    const count = await scriptProvider.countManyByIdList(
      scripts.map(s => s.resourceId)
    );
    expect(count).toBe(0);
  });

  test('should be able to delete stale scripts', async () => {
    const scriptProvider = kIjxSemantic.script();
    const scripts = await generateAndInsertAppScriptListForTest(5, {
      name: 'test-script' + getNewId(),
      status: kJobStatus.pending,
      statusLastUpdatedAt: getTimestamp() - kHeartbeatIntervalMs * 10,
    });

    await kIjxSemantic.utils().withTxn(async opts => {
      await scriptProvider.deleteStaleScripts(opts);
    });

    const count = await scriptProvider.countManyByIdList(
      scripts.map(s => s.resourceId)
    );
    expect(count).toBe(0);
  });
});

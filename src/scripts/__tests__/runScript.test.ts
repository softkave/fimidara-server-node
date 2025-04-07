import assert from 'assert';
import {noop} from 'lodash-es';
import {
  getDeferredPromise,
  getNewId,
  noopAsync,
  waitTimeout,
} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test, vi} from 'vitest';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {kJobStatus} from '../../definitions/job.js';
import {generateAndInsertAppScriptListForTest} from '../../endpoints/testHelpers/generate/script.js';
import {completeTests} from '../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../endpoints/testHelpers/utils.js';
import {runScript} from '../runScript.js';

const kHeartbeatIntervalMs = 100;
const kActiveAppHeartbeatDelayFactor = 1;
const kScriptPollIntervalMs = 100;

beforeAll(async () => {
  await initTests({
    useFimidaraApp: true,
    heartbeatIntervalMs: kHeartbeatIntervalMs,
    activeAppHeartbeatDelayFactor: kActiveAppHeartbeatDelayFactor,
    scriptPollIntervalMs: kScriptPollIntervalMs,
  });
});

afterAll(async () => {
  await completeTests();
});

describe('runScript', () => {
  test('should run a script', async () => {
    const name = 'test-script' + getNewId();
    const fn = vi.fn();
    await runScript({
      name,
      isUnique: false,
      fn,
    });

    expect(fn).toHaveBeenCalled();

    const dbScript = await kIjxSemantic.script().getScript({name});
    assert(dbScript);
    expect(dbScript.status).toBe(kJobStatus.completed);
  });

  test('should run a unique script only once', async () => {
    const name = 'test-script' + getNewId();
    const fn = vi.fn();
    await Promise.all([
      runScript({
        name,
        isUnique: true,
        fn,
      }),
      runScript({
        name,
        isUnique: true,
        fn,
      }),
    ]);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should wait for a unique script to complete', async () => {
    const name = 'test-script' + getNewId();
    const deferred01 = getDeferredPromise();
    let timestamp01: number | undefined;
    let timestamp02: number | undefined;
    const fn = vi.fn().mockImplementation(async () => {
      await deferred01.promise;
      timestamp01 = Date.now();
    });
    const p01 = runScript({
      name,
      isUnique: true,
      fn,
    });
    const p02 = runScript({
      name,
      isUnique: true,
      fn: noopAsync,
    });

    const deferred02 = getDeferredPromise();
    p02.then(() => {
      timestamp02 = Date.now();
      deferred02.resolve();
    });
    deferred01.resolve();
    await Promise.all([p01, p02]);
    await deferred02.promise;
    assert(timestamp01);
    assert(timestamp02);
    expect(timestamp02).toBeGreaterThan(timestamp01);
  });

  test('should throw an error if a mandatory script fails', async () => {
    const name = 'test-script' + getNewId();
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    await expect(
      runScript({
        name,
        isUnique: false,
        fn,
        isMandatory: true,
      })
    ).rejects.toThrow('test error');
  });

  test('should not throw an error if a non-mandatory script fails', async () => {
    const name = 'test-script' + getNewId();
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    await runScript({
      name,
      isUnique: false,
      fn,
      isMandatory: false,
    });
  });

  test('should throw an error if a unique script waited upon fails', async () => {
    const name = 'test-script' + getNewId();
    const deferred01 = getDeferredPromise();
    const fn = vi.fn().mockImplementation(async () => {
      await deferred01.promise;
      throw new Error('test error');
    });
    runScript({
      name,
      isUnique: true,
      fn,
      isMandatory: true,
    }).catch(noop);

    await waitTimeout(50);
    const p02 = runScript({
      name,
      isUnique: true,
      fn: noopAsync,
      isMandatory: true,
    });

    await expect(async () => {
      deferred01.resolve();
      await p02;
    }).rejects.toThrow(/Script failed/);
  });

  test('should throw an error if a unique and mandatory script waited upon is stale', async () => {
    const name = 'test-script' + getNewId();
    await generateAndInsertAppScriptListForTest(1, {
      name,
      status: kJobStatus.pending,
      uniqueId: name,
    });

    await expect(async () => {
      await runScript({
        name,
        isUnique: true,
        fn: noopAsync,
        isMandatory: true,
      });
    }).rejects.toThrow();
  });

  test('should mark a script as failed if it throws an error', async () => {
    const name = 'test-script' + getNewId();
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    await runScript({
      name,
      isUnique: false,
      fn,
      isMandatory: false,
    });

    const dbScript = await kIjxSemantic.script().getScript({name});
    assert(dbScript);
    expect(dbScript.status).toBe(kJobStatus.failed);
  });
});

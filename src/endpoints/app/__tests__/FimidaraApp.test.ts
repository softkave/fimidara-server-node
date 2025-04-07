import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kAppType} from '../../../definitions/app.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {waitTimeout} from '../../../utils/fns.js';
import {getNewId, getNewIdForResource} from '../../../utils/resource.js';
import {generateAndInsertAppListForTest} from '../../testHelpers/generate/app.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {initTests} from '../../testHelpers/utils.js';
import {FimidaraApp} from '../FimidaraApp.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

/**
 * - inserts in DB
 * - heartbeat
 * - active apps
 */

describe('FimidaraApp', () => {
  test('inserts in DB', async () => {
    const shard = getNewId();
    const appId = getNewIdForResource(kFimidaraResourceType.App);
    const app = new FimidaraApp({appId, shard, type: kAppType.runner});

    await app.startApp();

    const dbApp = await kIjxSemantic.app().getOneById(appId);
    expect(dbApp).toBeTruthy();
    expect(dbApp?.shard).toBe(shard);
    expect(dbApp?.type).toBe(kAppType.runner);

    await app.dispose();
  });

  test('heartbeat', async () => {
    const shard = getNewId();
    const appId = getNewIdForResource(kFimidaraResourceType.App);
    const heartbeatIntervalMs = 50; //  50ms
    const app = new FimidaraApp({
      appId,
      shard,
      type: kAppType.runner,
      heartbeatInterval: heartbeatIntervalMs,
    });

    await app.startApp();

    let dbApp = await kIjxSemantic.app().getOneById(appId);
    const startingHeartbeatMs = dbApp?.lastUpdatedAt;
    await waitTimeout(heartbeatIntervalMs * 2);
    dbApp = await kIjxSemantic.app().getOneById(appId);
    const preStopHeartbeatMs = dbApp?.lastUpdatedAt;
    assert(startingHeartbeatMs);
    expect(preStopHeartbeatMs).toBeGreaterThan(startingHeartbeatMs);

    await app.dispose();
    await kIjxUtils.promises().flush();

    // No more heartbeat after closing app
    dbApp = await kIjxSemantic.app().getOneById(appId);
    const postStopHeartbeatMs01 = dbApp?.lastUpdatedAt;
    await waitTimeout(heartbeatIntervalMs * 2);
    dbApp = await kIjxSemantic.app().getOneById(appId);
    const postStopHeartbeatMs02 = dbApp?.lastUpdatedAt;
    expect(postStopHeartbeatMs01).toBe(postStopHeartbeatMs02);
  });

  test('active apps updated', async () => {
    const shard = getNewId();
    const appId = getNewIdForResource(kFimidaraResourceType.App);
    const heartbeatIntervalMs = 50; //  50ms
    const app = new FimidaraApp({
      appId,
      shard,
      type: kAppType.runner,
      heartbeatInterval: heartbeatIntervalMs,
      activeAppHeartbeatDelayFactor: 5,
    });

    await generateAndInsertAppListForTest(/** count */ 2, {shard});
    await app.startApp();

    await waitTimeout(heartbeatIntervalMs * 2);
    const appIdList = app.getActiveAppIdList();
    expect(appIdList).toHaveLength(3);

    await app.dispose();
  });
});

import assert from 'assert';
import {kAppType} from '../../../definitions/app';
import {kFimidaraResourceType} from '../../../definitions/system';
import {waitTimeout} from '../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../utils/resource';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertAppListForTest} from '../../testUtils/generate/app';
import {completeTests} from '../../testUtils/helpers/testFns';
import {initTests} from '../../testUtils/testUtils';
import {FimidaraApp} from '../FimidaraApp';

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

    const dbApp = await kSemanticModels.app().getOneById(appId);
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

    let dbApp = await kSemanticModels.app().getOneById(appId);
    const startingHeartbeatMs = dbApp?.lastUpdatedAt;
    await waitTimeout(heartbeatIntervalMs * 2);
    dbApp = await kSemanticModels.app().getOneById(appId);
    const preStopHeartbeatMs = dbApp?.lastUpdatedAt;
    assert(startingHeartbeatMs);
    expect(preStopHeartbeatMs).toBeGreaterThan(startingHeartbeatMs);

    await app.dispose();

    dbApp = await kSemanticModels.app().getOneById(appId);
    const postStopHeartbeatMs01 = dbApp?.lastUpdatedAt;
    await waitTimeout(heartbeatIntervalMs * 2);
    dbApp = await kSemanticModels.app().getOneById(appId);
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

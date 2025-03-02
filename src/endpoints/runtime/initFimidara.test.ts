import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kIjxData,
  kIjxSemantic,
  kIkxUtils,
} from '../../contexts/ijx/injectables.js';
import EndpointReusableQueries from '../queries.js';
import {completeTests} from '../testUtils/helpers/testFns.js';
import {initTests} from '../testUtils/testUtils.js';
import {initFimidara, kAppRuntimeStatsDocId} from './initFimidara.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
  await completeTests();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context
    const suppliedConfig = kIkxUtils.suppliedConfig();
    const runtimeVars = await kIjxData
      .appRuntimeState()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
      );
    await Promise.all([
      kIjxSemantic.user().assertGetOneByQuery({
        email: suppliedConfig.rootUserEmail,
      }),
      kIjxSemantic.workspace().assertGetOneByQuery({
        resourceId: runtimeVars.appWorkspaceId,
      }),
    ]);

    expect(runtimeVars.isAppSetup).toBeTruthy();
  });

  test('app not setup a second time', async () => {
    const workspaceId = kIkxUtils.runtimeConfig().appWorkspaceId;
    const workspace = await initFimidara();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

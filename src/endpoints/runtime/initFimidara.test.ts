import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kIjxData,
  kIjxSemantic,
  kIjxUtils,
} from '../../contexts/ijx/injectables.js';
import EndpointReusableQueries from '../queries.js';
import {completeTests} from '../testHelpers/helpers/testFns.js';
import {initTests} from '../testHelpers/utils.js';
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
    const suppliedConfig = kIjxUtils.suppliedConfig();
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
    const workspaceId = kIjxUtils.runtimeConfig().appWorkspaceId;
    const workspace = await initFimidara();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

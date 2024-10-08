import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
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
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    const runtimeVars = await kDataModels
      .appRuntimeState()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
      );
    await Promise.all([
      kSemanticModels.user().assertGetOneByQuery({
        email: suppliedConfig.rootUserEmail,
      }),
      kSemanticModels.workspace().assertGetOneByQuery({
        resourceId: runtimeVars.appWorkspaceId,
      }),
    ]);

    expect(runtimeVars.isAppSetup).toBeTruthy();
  });

  test('app not setup a second time', async () => {
    const workspaceId = kUtilsInjectables.runtimeConfig().appWorkspaceId;
    const workspace = await initFimidara();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

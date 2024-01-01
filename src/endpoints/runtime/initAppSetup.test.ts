import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables';
import EndpointReusableQueries from '../queries';
import {completeTests} from '../testUtils/helpers/test';
import {initTests} from '../testUtils/testUtils';
import {kAppRuntimeStatsDocId, setupApp} from './initAppSetup';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context
    const suppliedConfig = kUtilsInjectables.suppliedConfig();
    await kDataModels
      .appRuntimeState()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
      );
    await kSemanticModels.user().assertGetOneByQuery({
      email: suppliedConfig.rootUserEmail,
    });
  });

  test('app not setup a second time', async () => {
    const workspaceId = kUtilsInjectables.runtimeConfig().appWorkspaceId;
    const workspace = await setupApp();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables';
import EndpointReusableQueries from '../queries';
import {completeTests} from '../testUtils/helpers/testFns';
import {initTests} from '../testUtils/testUtils';
import {initFimidara, kAppRuntimeStatsDocId} from './initFimidara';

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
      kSemanticModels.permissionGroup().assertGetOneByQuery({
        resourceId: runtimeVars.appUsersImageUploadPermissionGroupId,
      }),
      kSemanticModels.permissionGroup().assertGetOneByQuery({
        resourceId: runtimeVars.appWorkspacesImageUploadPermissionGroupId,
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

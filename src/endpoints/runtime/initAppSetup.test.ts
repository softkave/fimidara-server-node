import {kSemanticModels, kUtilsInjectables} from '../contexts/injectables';
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

    await context.data.appRuntimeState.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
    );
    await kSemanticModels.user().assertGetOneByQuery({
      email: kUtilsInjectables.config().rootUserEmail,
    });
  });

  test('app not setup a second time', async () => {
    const workspaceId = kUtilsInjectables.config().appWorkspaceId;
    const workspace = await setupApp();
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

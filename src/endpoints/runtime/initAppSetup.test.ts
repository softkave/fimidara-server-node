import EndpointReusableQueries from '../queries';
import {completeTest} from '../testUtils/helpers/test';
import {initTest} from '../testUtils/testUtils';
import {APP_RUNTIME_STATE_DOC_ID, setupApp} from './initAppSetup';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context

    await context.data.appRuntimeState.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID)
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

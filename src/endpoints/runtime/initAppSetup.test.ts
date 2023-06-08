import {BaseContextType} from '../contexts/types';
import EndpointReusableQueries from '../queries';
import {completeTest} from '../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../testUtils/testUtils';
import {APP_RUNTIME_STATE_DOC_ID, setupApp} from './initAppSetup';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context
    assertContext(context);
    await context.data.appRuntimeState.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID)
    );
    await context.semantic.user.assertGetOneByQuery({
      email: context.appVariables.rootUserEmail,
    });
  });

  test('app not setup a second time', async () => {
    assertContext(context);
    const workspaceId = context.appVariables.appWorkspaceId;
    const workspace = await setupApp(context);
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

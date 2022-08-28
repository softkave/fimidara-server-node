import {APP_RUNTIME_STATE_DOC_ID} from '../../definitions/system';
import {IBaseContext} from '../contexts/types';
import EndpointReusableQueries from '../queries';
import {assertContext, initTestBaseContext} from '../test-utils/test-utils';
import {setupApp} from './initAppSetup';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    // setupApp is called internally when getting test context
    assertContext(context);
    await context.data.appRuntimeState.assertGetItem(
      EndpointReusableQueries.getById(APP_RUNTIME_STATE_DOC_ID)
    );
  });

  test('app not setup a second time', async () => {
    assertContext(context);
    const workspaceId = context.appVariables.appWorkspaceId;
    const workspace = await setupApp(context);
    expect(workspace.resourceId).toBe(workspaceId);
  });
});

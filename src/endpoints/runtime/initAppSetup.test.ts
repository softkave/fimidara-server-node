import {APP_RUNTIME_STATE_DOC_ID} from '../../definitions/system';
import {IBaseContext} from '../contexts/BaseContext';
import EndpointReusableQueries from '../queries';
import {
  getTestBaseContext,
  assertContext,
  insertUserForTest,
  insertOrganizationForTest,
} from '../test-utils/test-utils';
import {setupApp} from './initAppSetup';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('init app setup', () => {
  test('app is setup', async () => {
    assertContext(context);
    await setupApp(context);
    await context.data.appRuntimeState.assertGetItem(
      EndpointReusableQueries.getById(APP_RUNTIME_STATE_DOC_ID)
    );
  });

  test('app not setup a second time', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const result = await insertOrganizationForTest(context, userToken);
    await context.data.appRuntimeState.saveItem({
      isAppSetup: true,
      resourceId: APP_RUNTIME_STATE_DOC_ID,
    });

    const org = await setupApp(context);
    expect(org).toMatchObject(result.organization);
  });
});

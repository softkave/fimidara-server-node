import {IPresetPermissionsGroupMatcher} from '../../../definitions/presetPermissionsGroup';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getProgramAccessToken from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('referenced preset returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IPresetPermissionsGroupMatcher>(
      mockExpressRequestWithUserToken(userToken),
      {
        presetId: preset.resourceId,
      }
    );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.preset).toMatchObject(preset);
});

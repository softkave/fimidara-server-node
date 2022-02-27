import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getProgramAccessToken from './handler';
import {IGetPresetPermissionsGroupEndpointParams} from './types';

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
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetPresetPermissionsGroupEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        presetId: preset.resourceId,
      }
    );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.preset).toMatchObject(preset);
});

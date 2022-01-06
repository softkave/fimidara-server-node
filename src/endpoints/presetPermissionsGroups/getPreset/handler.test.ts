import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getProgramAccessToken from './handler';
import {IGetPresetPermissionsGroupEndpointParams} from './types';

test('referenced preset returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetPresetPermissionsGroupEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      presetId: preset.presetId,
    }
  );

  const result = await getProgramAccessToken(context, instData);
  assertEndpointResultOk(result);
  expect(result.preset).toBe(preset);
});

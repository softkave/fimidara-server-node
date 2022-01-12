import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getOrganizationPresetPermissionsGroups from './handler';
import {IGetOrganizationPresetPermissionsGroupsEndpointParams} from './types';

test("organization's presets returned", async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationPresetPermissionsGroupsEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
    }
  );

  const result = await getOrganizationPresetPermissionsGroups(
    context,
    instData
  );
  assertEndpointResultOk(result);
  expect(result.presets).toContain(preset01);
  expect(result.presets).toContain(preset02);
});

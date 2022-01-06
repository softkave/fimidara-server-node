import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getOrganizationPresetPermissionsGroups from './handler';
import {IGetOrganizationPresetPermissionsGroupsEndpointParams} from './types';

test("organization's presets returned", async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetOrganizationPresetPermissionsGroupsEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
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

import {AppResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTest01,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getEntityPermissionItems from './handler';
import {IGetEntityPermissionItemsParams} from './types';

test('entity permission items returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {items} = await insertPermissionItemsForTest01(
    context,
    userToken,
    organization.organizationId,
    {
      permissionEntityId: preset.presetId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    },
    {
      permissionOwnerId: organization.organizationId,
      permissionOwnerType: AppResourceType.Organization,
    },
    {resourceType: AppResourceType.File}
  );

  const instData = RequestData.fromExpressRequest<IGetEntityPermissionItemsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      permissionEntityId: preset.presetId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    }
  );

  const result = await getEntityPermissionItems(context, instData);
  assertEndpointResultOk(result);
  expect(result.items).toBe(items);
});

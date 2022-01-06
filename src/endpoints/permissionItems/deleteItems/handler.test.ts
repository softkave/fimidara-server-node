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
import PermissionItemQueries from '../queries';
import deletePermissionItems from './handler';
import {IDeletePermissionItemsParams} from './types';

test('permission items deleted', async () => {
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

  const itemIds = items.map(item => item.itemId);
  const instData = RequestData.fromExpressRequest<IDeletePermissionItemsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      permissionEntityId: preset.presetId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      itemIds: itemIds,
    }
  );

  const result = await deletePermissionItems(context, instData);
  assertEndpointResultOk(result);
  const deletedItems = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByIds(itemIds, organization.organizationId)
  );

  expect(deletedItems.length).toBe(0);
});
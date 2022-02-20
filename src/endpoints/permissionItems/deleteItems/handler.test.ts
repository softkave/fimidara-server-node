import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTest01,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import deletePermissionItems from './handler';
import {IDeletePermissionItemsParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('permission items deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {items} = await insertPermissionItemsForTest01(
    context,
    userToken,
    organization.resourceId,
    {
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    },
    {
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
    },
    {itemResourceType: AppResourceType.File}
  );

  const itemIds = items.map(item => item.resourceId);
  const instData = RequestData.fromExpressRequest<IDeletePermissionItemsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
      itemIds: itemIds,
    }
  );

  const result = await deletePermissionItems(context, instData);
  assertEndpointResultOk(result);
  const deletedItems = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByIds(itemIds, organization.resourceId)
  );

  expect(deletedItems.length).toEqual(0);
});

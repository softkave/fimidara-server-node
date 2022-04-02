import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTestByEntity,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import getEntityPermissionItems from './handler';
import {IDeletePermissionItemsByIdEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('deleteItemsById', () => {
  test('permission items deleted', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    const {items} = await insertPermissionItemsForTestByEntity(
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

    const instData =
      RequestData.fromExpressRequest<IDeletePermissionItemsByIdEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          organizationId: organization.resourceId,
          itemIds: items.map(item => item.resourceId),
        }
      );

    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);

    const presetPermissionItems =
      await context.data.permissionItem.getManyItems(
        PermissionItemQueries.getByPermissionEntity(
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      );

    expect(presetPermissionItems.length).toBe(0);
  });
});

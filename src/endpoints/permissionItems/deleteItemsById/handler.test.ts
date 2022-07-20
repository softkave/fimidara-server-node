import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTestByEntity,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import getEntityPermissionItems from './handler';
import {IDeletePermissionItemsByIdEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('deleteItemsById', () => {
  test('permission items deleted', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const {items} = await insertPermissionItemsForTestByEntity(
      context,
      userToken,
      workspace.resourceId,
      {
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
      },
      {
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
      },
      {itemResourceType: AppResourceType.File}
    );

    const instData =
      RequestData.fromExpressRequest<IDeletePermissionItemsByIdEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          workspaceId: workspace.resourceId,
          itemIds: items.map(item => item.resourceId),
        }
      );

    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);

    const permissionGroupItems = await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        permissionGroup.resourceId,
        AppResourceType.PermissionGroup
      )
    );

    expect(permissionGroupItems.length).toBe(0);
  });
});

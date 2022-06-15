import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTestByEntity,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import deletePermissionItemsByEntity from './handler';
import {IDeletePermissionItemsByEntityEndpointParams} from './types';

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
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
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

  const itemIds = items.map(item => item.resourceId);
  const instData =
    RequestData.fromExpressRequest<IDeletePermissionItemsByEntityEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        itemIds: itemIds,
      }
    );

  const result = await deletePermissionItemsByEntity(context, instData);
  assertEndpointResultOk(result);
  const deletedItems = await context.data.permissionItem.getManyItems(
    PermissionItemQueries.getByIds(itemIds, workspace.resourceId)
  );

  expect(deletedItems.length).toEqual(0);
});

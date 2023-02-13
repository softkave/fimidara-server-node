import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
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
import deletePermissionItemsByEntity from './handler';
import {IDeletePermissionItemsByEntityEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
    },
    {targetType: AppResourceType.File}
  );

  const itemIds = items.map(item => item.resourceId);
  const instData = RequestData.fromExpressRequest<IDeletePermissionItemsByEntityEndpointParams>(
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
  const deletedItems = await context.data.permissionItem.getManyByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndResourceIdList(workspace.resourceId, itemIds)
  );

  expect(deletedItems.length).toEqual(0);
});

import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTestForEntity,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
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
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {items} = await insertPermissionItemsForTestForEntity(
      context,
      mockExpressRequestWithAgentToken(userToken),
      workspace.resourceId,
      {entityId: permissionGroup.resourceId},
      {containerId: workspace.resourceId},
      {targetType: AppResourceType.File}
    );
    const instData = RequestData.fromExpressRequest<IDeletePermissionItemsByIdEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        itemIds: items.map(item => item.resourceId),
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);

    const permissionGroupItems = await context.data.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );
    expect(permissionGroupItems.length).toBe(0);
  });
});

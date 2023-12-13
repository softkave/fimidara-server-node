import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import PermissionItemQueries from '../queries';
import getEntityPermissionItems from './handler';
import {DeletePermissionItemsByIdEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe.skip('deleteItemsById', () => {
  test('permission items deleted', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );
    const items = await generateAndInsertPermissionItemListForTest();
    const instData =
      RequestData.fromExpressRequest<DeletePermissionItemsByIdEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          itemIds: items.map(item => item.resourceId),
        }
      );
    const result = await getEntityPermissionItems(instData);
    assertEndpointResultOk(result);
    const permissionGroupItems = await kSemanticModels
      .permissionItem()
      .getManyByQuery(
        PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
      );
    expect(permissionGroupItems.length).toBe(0);
  });
});

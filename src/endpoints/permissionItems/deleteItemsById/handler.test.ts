import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import PermissionItemQueries from '../queries';
import getEntityPermissionItems from './handler';
import {DeletePermissionItemsByIdEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe.skip('deleteItemsById', () => {
  test('permission items deleted', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const items = await generateAndInsertPermissionItemListForTest(context);
    const instData = RequestData.fromExpressRequest<DeletePermissionItemsByIdEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        itemIds: items.map(item => item.resourceId),
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    const permissionGroupItems = await context.semantic.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );
    expect(permissionGroupItems.length).toBe(0);
  });
});

import {AppActionType, AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTest,
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
  await completeTest({context});
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
    const {items} = await insertPermissionItemsForTest(context, userToken, workspace.resourceId, {
      entity: {entityId: permissionGroup.resourceId},
      target: {targetType: AppResourceType.File},
      grantAccess: true,
      action: AppActionType.Read,
    });
    const instData = RequestData.fromExpressRequest<IDeletePermissionItemsByIdEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        itemIds: items.map(item => item.resourceId),
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    const permissionGroupItems = await context.semantic.permissionItem.getManyByLiteralDataQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );
    expect(permissionGroupItems.length).toBe(0);
  });
});

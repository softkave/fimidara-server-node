import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
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
import getEntityPermissionItems from './handler';
import {GetEntityPermissionItemsEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe.skip('getEntityPermissionitems', () => {
  test('entity permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const {items} = await insertPermissionItemsForTest(context, userToken, workspace.resourceId, [
      {
        entity: {entityId: permissionGroup.resourceId},
        target: {targetType: AppResourceType.File, targetId: workspace.resourceId},
        grantAccess: true,
        action: AppActionType.Read,
        appliesTo: PermissionItemAppliesTo.ChildrenOfType,
      },
    ]);
    const instData = RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        entityId: permissionGroup.resourceId,
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.items).toEqual(items);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      entityType: AppResourceType.User,
      targetId: workspace.resourceId,
    });
    const count = await context.semantic.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      entityId: user.resourceId,
      targetId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        entityId: user.resourceId,
      }
    );
    let result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        entityId: user.resourceId,
      }
    );
    result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});

import {faker} from '@faker-js/faker';
import {AppActionType, AppResourceType, getWorkspaceActionList} from '../../../definitions/system';
import {calculatePageSize, getResourceId} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {expectContainsExactly} from '../../testUtils/helpers/assertion';
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
import addPermissionItems from '../addItems/handler';
import {IAddPermissionItemsEndpointParams} from '../addItems/types';
import {IPermissionItemInput} from '../types';
import {default as getResourcePermissionItems} from './handler';
import {IGetResourcePermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{permissionGroup: pg01}, {permissionGroup: pg02}] = await Promise.all([
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    ]);
    const inputItems: IPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as AppActionType,
      grantAccess: faker.datatype.boolean(),
      target: {targetId: pg02.resourceId},
    }));
    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: inputItems,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg01.resourceId},
        }
      );
    const {items} = await addPermissionItems(context, addPermissionItemsReqData);
    const instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, targetId: pg02.resourceId}
    );
    const result = await getResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectContainsExactly(items, result.items, getResourceId);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    });
    const count = await context.semantic.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    let result = await getResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    result = await getResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.items.length).toBeGreaterThanOrEqual(calculatePageSize(count, pageSize, page));
  });
});

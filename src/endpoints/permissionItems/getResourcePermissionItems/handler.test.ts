import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {expectPermissionItemsPresent} from '../../testUtils/helpers/permissionItem';
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
import {IAddPermissionItemsEndpointParams, INewPermissionItemInput} from '../addItems/types';
import {
  default as getEntityPermissionItems,
  default as getResourcePermissionItems,
} from './handler';
import {IGetResourcePermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

describe('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const inputItems: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as BasicCRUDActions,
      grantAccess: faker.datatype.boolean(),
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));

    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId, entityId: permissionGroup.resourceId}
      );
    const addPermissionItemsResult = await addPermissionItems(context, addPermissionItemsReqData);
    const items = addPermissionItemsResult.items;
    const instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectPermissionItemsPresent(
      permissionGroup.resourceId,
      workspace.resourceId,
      result.items,
      items
    );
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

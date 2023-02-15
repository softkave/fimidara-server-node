import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../test-utils/generate-data/permissionItem';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
      permissionEntityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
    }));

    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId}
      );

    const addPermissionItemsResult = await addPermissionItems(context, addPermissionItemsReqData);
    const items = addPermissionItemsResult.items;
    const instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }
    );
    const result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
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
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
    });
    const count = await context.data.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetResourcePermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
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
      mockExpressRequestWithUserToken(userToken),
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
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});

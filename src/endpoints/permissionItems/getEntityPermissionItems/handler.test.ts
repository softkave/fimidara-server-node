import {AppResourceType} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionItemListForTest} from '../../test-utils/generate-data/permissionItem';
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
import getEntityPermissionItems from './handler';
import {IGetEntityPermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getEntityPermissionitems', () => {
  test('entity permission items returned', async () => {
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

    const instData = RequestData.fromExpressRequest<IGetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
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
      permissionOwnerId: workspace.resourceId,
      permissionOwnerType: AppResourceType.Workspace,
      permissionEntityId: user.resourceId,
      permissionEntityType: AppResourceType.User,
    });
    const count = await context.data.permissionItem.countByQuery({
      workspaceId: workspace.resourceId,
      permissionOwnerId: workspace.resourceId,
      permissionOwnerType: AppResourceType.Workspace,
      permissionEntityId: user.resourceId,
      permissionEntityType: AppResourceType.User,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        permissionEntityId: user.resourceId,
        permissionEntityType: AppResourceType.User,
      }
    );
    let result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetEntityPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        page,
        pageSize,
        workspaceId: workspace.resourceId,
        permissionEntityId: user.resourceId,
        permissionEntityType: AppResourceType.User,
      }
    );
    result = await getEntityPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.items).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});

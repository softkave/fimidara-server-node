import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
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
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getEntityPermissionitems', () => {
  test('entity permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(
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

    const instData =
      RequestData.fromExpressRequest<IGetEntityPermissionItemsEndpointParams>(
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
});

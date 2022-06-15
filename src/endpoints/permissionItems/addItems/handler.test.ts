import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import addPermissionItems from './handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('addItems', () => {
  test('permission items added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const items: INewPermissionItemInput[] = getWorkspaceActionList().map(
      action => ({
        action: action as BasicCRUDActions,
        grantAccess: faker.datatype.boolean(),
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
        itemResourceType: AppResourceType.Workspace,
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        itemResourceId: workspace.resourceId,
      })
    );

    const instData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items, workspaceId: workspace.resourceId}
      );

    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
  });

  test('permission items are not duplicated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} =
      await insertPermissionGroupForTest(
        context,
        userToken,
        workspace.resourceId
      );

    const items: INewPermissionItemInput[] = getWorkspaceActionList().map(
      action => ({
        action: action as BasicCRUDActions,
        grantAccess: faker.datatype.boolean(),
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
        itemResourceType: AppResourceType.Workspace,
        permissionEntityId: permissionGroup.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        permissionOwnerId: workspace.resourceId,
        permissionOwnerType: AppResourceType.Workspace,
        itemResourceId: workspace.resourceId,
      })
    );

    const instData =
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {items, workspaceId: workspace.resourceId}
      );

    // First insert
    await addPermissionItems(context, instData);

    // Second insert of the very same permission items as the first
    // insert
    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);

    const permissionGroupItems = await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        permissionGroup.resourceId,
        AppResourceType.PermissionGroup
      )
    );

    expect(permissionGroupItems.length).toBe(result.items.length);
  });
});

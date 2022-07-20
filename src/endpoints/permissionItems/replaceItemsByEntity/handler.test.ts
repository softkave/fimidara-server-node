import {AppResourceType} from '../../../definitions/system';
import {IPermissionEntity} from '../../contexts/authorization-checks/getPermissionEntities';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTestByEntity,
  insertUserForTest,
  insertWorkspaceForTest,
  ITestPermissionItemByEntityBase,
  ITestPermissionItemOwner,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';

/**
 * TODO:
 * [Low] - Test that hanlder fails if entity not found
 * [Medium] - Test for collaborator entity
 * [Medium] - Test for program access token entity
 * [Medium] - Test for client assigned token entity
 * [Medium] - Test for different resources and owners
 * [Medium] - Test that items are not getting duplicated in DB
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('replaceItemsByEntity', () => {
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

    await insertPermissionItemsForTestByEntity(
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

    const itemsOwner: ITestPermissionItemOwner = {
      permissionOwnerId: workspace.resourceId,
      permissionOwnerType: AppResourceType.Workspace,
    };

    const itemsBase: ITestPermissionItemByEntityBase = {
      itemResourceType: AppResourceType.File,
    };

    const entity: IPermissionEntity = {
      permissionEntityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
    };

    // First insert
    await insertPermissionItemsForTestByEntity(
      context,
      userToken,
      workspace.resourceId,
      entity,
      itemsOwner,
      itemsBase
    );

    // Second insert of the very same permission items as the first
    // insert
    const result = await insertPermissionItemsForTestByEntity(
      context,
      userToken,
      workspace.resourceId,
      entity,
      itemsOwner,
      itemsBase
    );

    const permissionGroupItems = await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        entity.permissionEntityId,
        entity.permissionEntityType
      )
    );

    expect(permissionGroupItems.length).toBe(result.items.length);
  });
});

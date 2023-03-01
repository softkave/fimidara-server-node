import {AppResourceType} from '../../../definitions/system';
import {IPermissionEntity} from '../../contexts/authorization-checks/getPermissionEntities';
import {IBaseContext} from '../../contexts/types';
import {
  assertContext,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertPermissionItemsForTestForEntity,
  insertUserForTest,
  insertWorkspaceForTest,
  ITestPermissionItemContainer,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';
import {INewPermissionItemInputByEntity} from './types';

/**
 * TODO:
 * [Low] - Test that hanlder fails if entity not found
 * [Medium] - Test for collaborator entity
 * [Medium] - Test for program access token entity
 * [Medium] - Test for client assigned token entity
 * [Medium] - Test for different resources and containers
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
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    await insertPermissionItemsForTestForEntity(
      context,
      mockExpressRequestWithUserToken(userToken),
      workspace.resourceId,
      {entityId: permissionGroup.resourceId},
      {containerId: workspace.resourceId},
      {targetType: AppResourceType.File}
    );
  });

  test('permission items are not duplicated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const itemsContainer: ITestPermissionItemContainer = {containerId: workspace.resourceId};
    const itemsBase: Partial<INewPermissionItemInputByEntity> = {
      targetType: AppResourceType.File,
    };
    const entity: IPermissionEntity = {entityId: permissionGroup.resourceId};

    // First insert
    await insertPermissionItemsForTestForEntity(
      context,
      mockExpressRequestWithUserToken(userToken),
      workspace.resourceId,
      entity,
      itemsContainer,
      itemsBase
    );

    // Second insert of the very same permission items as the first
    // insert
    const result = await insertPermissionItemsForTestForEntity(
      context,
      mockExpressRequestWithUserToken(userToken),
      workspace.resourceId,
      entity,
      itemsContainer,
      itemsBase
    );
    const permissionGroupItems = await context.data.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(entity.entityId)
    );
    expect(permissionGroupItems.length).toBe(result.items.length);
  });
});

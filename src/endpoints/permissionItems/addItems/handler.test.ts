import {AppResourceType} from '../../../definitions/system';
import {IPermissionEntity} from '../../contexts/authorization-checks/getPermissionEntities';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTestUsingOwnerAndBase,
  insertPresetForTest,
  insertUserForTest,
  ITestPermissionItemBase,
  ITestPermissionItemOwner,
  makeTestPermissionItemInputs,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';

/**
 * TODO:
 * [Low] - Test that hanlder fails if entity does not exist
 * [Medium] - Test for collaborator entity
 * [Medium] - Test for program access token entity
 * [Medium] - Test for client assigned token entity
 * [Medium] - Test for different resources and owners
 * [Medium] - Test that items are not getting duplicated in DB
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('add permission items', () => {
  test('permission items added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    await insertPermissionItemsForTestUsingOwnerAndBase(
      context,
      userToken,
      organization.resourceId,
      {
        permissionEntityId: preset.resourceId,
        permissionEntityType: AppResourceType.PresetPermissionsGroup,
      },
      {
        permissionOwnerId: organization.resourceId,
        permissionOwnerType: AppResourceType.Organization,
      },
      {itemResourceType: AppResourceType.File}
    );
  });

  test('permission items are not duplicated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    const itemsOwner: ITestPermissionItemOwner = {
      permissionOwnerId: organization.resourceId,
      permissionOwnerType: AppResourceType.Organization,
    };

    const itemsBase: ITestPermissionItemBase = {
      itemResourceType: AppResourceType.File,
    };

    const entity: IPermissionEntity = {
      permissionEntityId: preset.resourceId,
      permissionEntityType: AppResourceType.PresetPermissionsGroup,
    };

    // First insert
    await insertPermissionItemsForTestUsingOwnerAndBase(
      context,
      userToken,
      organization.resourceId,
      entity,
      itemsOwner,
      itemsBase
    );

    // Second insert of the very same permission items as the first
    // insert
    const result = await insertPermissionItemsForTestUsingOwnerAndBase(
      context,
      userToken,
      organization.resourceId,
      entity,
      itemsOwner,
      itemsBase
    );

    const presetPermissionItems =
      await context.data.permissionItem.getManyItems(
        PermissionItemQueries.getByPermissionEntity(
          entity.permissionEntityId,
          entity.permissionEntityType
        )
      );

    expect(presetPermissionItems.length).toBe(result.items.length);
  });
});

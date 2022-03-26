import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTestByResource,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import PermissionItemQueries from '../queries';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('replaceItemsByResources', () => {
  test('permission items added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {preset} = await insertPresetForTest(
      context,
      userToken,
      organization.resourceId
    );

    await insertPermissionItemsForTestByResource(
      context,
      userToken,
      organization.resourceId,
      organization.resourceId,
      AppResourceType.Organization,
      organization.resourceId,
      AppResourceType.Organization,
      preset.resourceId,
      AppResourceType.PresetPermissionsGroup
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

    // First insert
    await insertPermissionItemsForTestByResource(
      context,
      userToken,
      organization.resourceId,
      organization.resourceId,
      AppResourceType.Organization,
      organization.resourceId,
      AppResourceType.Organization,
      preset.resourceId,
      AppResourceType.PresetPermissionsGroup
    );

    // Second insert of the very same permission items as the first
    // insert
    const result = await insertPermissionItemsForTestByResource(
      context,
      userToken,
      organization.resourceId,
      organization.resourceId,
      AppResourceType.Organization,
      organization.resourceId,
      AppResourceType.Organization,
      preset.resourceId,
      AppResourceType.PresetPermissionsGroup
    );

    const presetPermissionItems =
      await context.data.permissionItem.getManyItems(
        PermissionItemQueries.getByOwnerAndResource(
          organization.resourceId,
          AppResourceType.Organization,
          AppResourceType.Organization,
          organization.resourceId
        )
      );

    expect(presetPermissionItems.length).toBe(result.items.length);
  });
});

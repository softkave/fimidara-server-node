import {AppResourceType} from '../../../definitions/system';
import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertPermissionItemsForTest01,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if entity does not exist
 * [Medium] - Test for collaborator entity
 * [Medium] - Test for program access token entity
 * [Medium] - Test for client assigned token entity
 * [Medium] - Test for different resources and owners
 */

test('permission items added', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  await insertPermissionItemsForTest01(
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

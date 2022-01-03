import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils';
import PresetPermissionsGroupQueries from '../queries';

/**
 * TODO:
 * [Low] - Test that hanlder fails if preset exists
 */

test('preset permissions group added', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const savedPreset = await context.data.presetPermissionsGroup.assertGetItem(
    PresetPermissionsGroupQueries.getById(preset.presetId)
  );

  expect(savedPreset).toBe(preset);
});

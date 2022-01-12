import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const savedPreset = await context.data.preset.assertGetItem(
    PresetPermissionsGroupQueries.getById(preset.resourceId)
  );

  expect(savedPreset).toEqual(preset);
});

import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import PresetPermissionsGroupQueries from '../queries';
import {presetPermissionsGroupExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if preset exists
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('preset permissions group added', async () => {
  assertContext(context);
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

  expect(presetPermissionsGroupExtractor(savedPreset)).toMatchObject(preset);
});

import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import PresetPermissionsGroupQueries from '../queries';
import updatePresetPermissionsGroup from './handler';
import {
  IUpdatePresetPermissionsGroupInput,
  IUpdatePresetPermissionsGroupParams,
} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if assigned presets doesn't exist
 */

test('preset updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset: preset00} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const updatePresetInput: IUpdatePresetPermissionsGroupInput = {
    name: faker.lorem.sentence(20),
    description: faker.lorem.sentence(50),
    presets: [
      {
        presetId: preset01.presetId,
        order: 1,
      },
      {
        presetId: preset02.presetId,
        order: 2,
      },
    ],
  };

  const instData = RequestData.fromExpressRequest<IUpdatePresetPermissionsGroupParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      presetId: preset00.presetId,
      preset: updatePresetInput,
    }
  );

  const result = await updatePresetPermissionsGroup(context, instData);
  assertEndpointResultHasNoErrors(result);

  const updatedPreset = await context.data.presetPermissionsGroup.assertGetItem(
    PresetPermissionsGroupQueries.getById(preset00.presetId)
  );

  expect(updatedPreset).toEqual(result.preset);
  expect(updatedPreset.name).toEqual(updatePresetInput.name);
  expect(updatedPreset.description).toEqual(updatePresetInput.description);
  expect(updatedPreset.presets.length).toBe(2);
  expect(updatedPreset.presets[0]).toEqual({
    presetId: preset01.presetId,
    assignedBy: user.userId,
    order: 0,
  });
  expect(updatedPreset.presets[0]).toEqual({
    presetId: preset02.presetId,
    assignedBy: user.userId,
    order: 1,
  });
});

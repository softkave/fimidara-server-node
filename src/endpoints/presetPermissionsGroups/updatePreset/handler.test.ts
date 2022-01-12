import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const updatePresetInput: IUpdatePresetPermissionsGroupInput = {
    name: faker.lorem.sentence(20),
    description: faker.lorem.sentence(50),
    presets: [
      {
        presetId: preset01.resourceId,
        order: 1,
      },
      {
        presetId: preset02.resourceId,
        order: 2,
      },
    ],
  };

  const instData = RequestData.fromExpressRequest<IUpdatePresetPermissionsGroupParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      presetId: preset00.resourceId,
      preset: updatePresetInput,
    }
  );

  const result = await updatePresetPermissionsGroup(context, instData);
  assertEndpointResultOk(result);

  const updatedPreset = await context.data.presetPermissionsGroup.assertGetItem(
    PresetPermissionsGroupQueries.getById(preset00.resourceId)
  );

  expect(updatedPreset).toMatchObject(result.preset);
  expect(updatedPreset.name).toBe(updatePresetInput.name);
  expect(updatedPreset.description).toBe(updatePresetInput.description);
  expect(updatedPreset.presets.length).toBe(2);
  expect(updatedPreset.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: user.resourceId,
    order: 0,
  });
  expect(updatedPreset.presets[0]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: user.resourceId,
    order: 1,
  });
});

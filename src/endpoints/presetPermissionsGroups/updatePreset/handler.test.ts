import * as faker from 'faker';
import {SessionAgentType} from '../../../definitions/system';
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
    name: faker.lorem.words(2),
    description: faker.lorem.words(10),
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
      data: updatePresetInput,
    }
  );

  const result = await updatePresetPermissionsGroup(context, instData);
  assertEndpointResultOk(result);

  const updatedPreset = await context.data.preset.assertGetItem(
    PresetPermissionsGroupQueries.getById(preset00.resourceId)
  );

  expect(updatedPreset).toMatchObject(result.preset);
  expect(updatedPreset.name).toEqual(updatePresetInput.name);
  expect(updatedPreset.description).toEqual(updatePresetInput.description);
  expect(updatedPreset.presets.length).toEqual(2);
  expect(updatedPreset.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(updatedPreset.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});

import * as faker from 'faker';
import {AppResourceType, SessionAgentType} from '../../../definitions/system';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import PresetPermissionsGroupQueries from '../queries';
import {presetPermissionsGroupExtractor} from '../utils';
import updatePresetPermissionsGroup from './handler';
import {
  IUpdatePresetPermissionsGroupInput,
  IUpdatePresetPermissionsGroupEndpointParams,
} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if assigned presets doesn't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('preset updated', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {preset: preset00} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
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

  const instData =
    RequestData.fromExpressRequest<IUpdatePresetPermissionsGroupEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        presetId: preset00.resourceId,
        preset: updatePresetInput,
      }
    );

  const result = await updatePresetPermissionsGroup(context, instData);
  assertEndpointResultOk(result);

  const updatedPreset = await withAssignedPresetsAndTags(
    context,
    workspace.resourceId,
    await context.data.preset.assertGetItem(
      PresetPermissionsGroupQueries.getById(preset00.resourceId)
    ),
    AppResourceType.PresetPermissionsGroup
  );

  expect(presetPermissionsGroupExtractor(updatedPreset)).toMatchObject(
    result.preset
  );
  expect(updatedPreset.name).toEqual(updatePresetInput.name);
  expect(updatedPreset.description).toEqual(updatePresetInput.description);
  expect(result.preset.presets.length).toEqual(2);
  expect(result.preset.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 1,
  });

  expect(result.preset.presets[1]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: {agentId: user.resourceId, agentType: SessionAgentType.User},
    order: 2,
  });
});

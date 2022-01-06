import {omit} from 'lodash';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import PresetPermissionsGroupQueries from '../queries';
import {
  checkPresetPermissionsGroupAuthorization02,
  PresetPermissionsGroupUtils,
} from '../utils';
import {UpdatePresetPermissionsGroupEndpoint} from './types';
import {updatePresetPermissionsGroupJoiSchema} from './validation';

/**
 * updatePresetPermissionsGroup.
 * Updates the referenced preset.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Check assigned presets exist and access check
 * - Update preset
 */

const updatePresetPermissionsGroup: UpdatePresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updatePresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorization02(
    context,
    agent,
    data.presetId,
    BasicCRUDActions.Update
  );

  const update: Partial<IPresetPermissionsGroup> = {
    ...omit(data.preset, 'presets'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
  };

  if (data.preset.presets) {
    update.presets = data.preset.presets.map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }));
  }

  const item = await context.data.presetPermissionsGroup.assertUpdateItem(
    PresetPermissionsGroupQueries.getById(preset.presetId),
    update
  );

  return {
    preset: PresetPermissionsGroupUtils.extractPublicPresetPermissionsGroup(
      item
    ),
  };
};

export default updatePresetPermissionsGroup;
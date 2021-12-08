import {omit} from 'lodash';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {
  checkPresetPermissionsGroupAuthorization02,
  PresetPermissionsItemUtils,
} from '../utils';
import {UpdatePresetPermissionsItemEndpoint} from './types';
import {updatePresetPermissionsItemJoiSchema} from './validation';

const updatePresetPermissionsItem: UpdatePresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updatePresetPermissionsItemJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorization02(
    context,
    agent,
    data.itemId,
    BasicCRUDActions.Update
  );

  const update: Partial<IPresetPermissionsGroup> = {
    ...omit(data.data, 'presets'),
    lastUpdatedAt: getDateString(),
    lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
  };

  if (data.data.presets) {
    update.presets = data.data.presets.map(preset => ({
      ...preset,
      assignedAt: getDateString(),
      assignedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    }));
  }

  const item = await context.data.presetPermissionsGroup.assertUpdateItem(
    PresetPermissionsItemQueries.getById(preset.presetId),
    update
  );

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default updatePresetPermissionsItem;

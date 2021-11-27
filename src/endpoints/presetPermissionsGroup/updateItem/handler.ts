import {BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {
  checkPresetPermissionsGroupAuthorizationWithId,
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
  const {preset} = await checkPresetPermissionsGroupAuthorizationWithId(
    context,
    agent,
    data.itemId,
    BasicCRUDActions.Update
  );

  const item = await context.data.presetPermissionsGroup.assertUpdateItem(
    PresetPermissionsItemQueries.getById(preset.presetId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
    }
  );

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default updatePresetPermissionsItem;

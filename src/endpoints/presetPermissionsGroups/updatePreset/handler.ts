import {omit} from 'lodash';
import {IPresetPermissionsGroup} from '../../../definitions/presetPermissionsGroup';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {saveResourceAssignedItems} from '../../assignedItems/addAssignedItems';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {checkPresetNameExists} from '../checkPresetNameExists';
import PresetPermissionsGroupQueries from '../queries';
import {
  checkPresetPermissionsGroupAuthorization03,
  presetPermissionsGroupExtractor,
} from '../utils';
import {UpdatePresetPermissionsGroupEndpoint} from './types';
import {updatePresetPermissionsGroupJoiSchema} from './validation';

const updatePresetPermissionsGroup: UpdatePresetPermissionsGroupEndpoint =
  async (context, instData) => {
    const data = validate(instData.data, updatePresetPermissionsGroupJoiSchema);
    const agent = await context.session.getAgent(context, instData);
    let {preset, organization} =
      await checkPresetPermissionsGroupAuthorization03(
        context,
        agent,
        data,
        BasicCRUDActions.Update
      );

    const update: Partial<IPresetPermissionsGroup> = {
      ...omit(data.preset, 'presets'),
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: {agentId: agent.agentId, agentType: agent.agentType},
    };

    if (update.name) {
      await checkPresetNameExists(
        context,
        organization.resourceId,
        update.name
      );
    }

    const item = await context.data.preset.assertUpdateItem(
      PresetPermissionsGroupQueries.getById(preset.resourceId),
      update
    );

    await saveResourceAssignedItems(
      context,
      agent,
      organization,
      preset.resourceId,
      AppResourceType.PresetPermissionsGroup,
      data.preset
    );

    preset = await withAssignedPresetsAndTags(
      context,
      preset.organizationId,
      preset,
      AppResourceType.PresetPermissionsGroup
    );

    return {
      preset: presetPermissionsGroupExtractor(item),
    };
  };

export default updatePresetPermissionsGroup;

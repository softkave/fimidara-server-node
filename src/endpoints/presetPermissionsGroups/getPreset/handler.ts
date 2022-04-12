import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withAssignedPresetsAndTags} from '../../assignedItems/getAssignedItems';
import {
  checkPresetPermissionsGroupAuthorization03,
  presetPermissionsGroupExtractor,
} from '../utils';
import {GetPresetPermissionsGroupEndpoint} from './types';
import {getPresetPermissionsGroupJoiSchema} from './validation';

const getPresetPermissionsGroup: GetPresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {preset} = await checkPresetPermissionsGroupAuthorization03(
    context,
    agent,
    data,
    BasicCRUDActions.Read
  );

  preset = await withAssignedPresetsAndTags(
    context,
    preset.workspaceId,
    preset,
    AppResourceType.PresetPermissionsGroup
  );

  return {
    preset: presetPermissionsGroupExtractor(preset),
  };
};

export default getPresetPermissionsGroup;

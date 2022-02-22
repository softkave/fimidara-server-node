import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkPresetPermissionsGroupAuthorization02,
  PresetPermissionsGroupUtils,
} from '../utils';
import {GetPresetPermissionsGroupEndpoint} from './types';
import {getPresetPermissionsGroupJoiSchema} from './validation';

/**
 * getPresetPermissionsGroup.
 * Returns the referenced preset if the calling agent has read access to it.
 *
 * Ensure that:
 * - Auth check and permission check
 * - Return referenced preset
 */

const getPresetPermissionsGroup: GetPresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorization02(
    context,
    agent,
    data.presetId,
    BasicCRUDActions.Read
  );

  return {
    preset:
      PresetPermissionsGroupUtils.extractPublicPresetPermissionsGroup(preset),
  };
};

export default getPresetPermissionsGroup;

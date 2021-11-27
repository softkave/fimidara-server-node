import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {
  checkPresetPermissionsGroupAuthorizationWithId,
  PresetPermissionsItemUtils,
} from '../utils';
import {GetPresetPermissionsItemEndpoint} from './types';
import {getPresetPermissionsItemJoiSchema} from './validation';

const getPresetPermissionsItem: GetPresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPresetPermissionsItemJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorizationWithId(
    context,
    agent,
    data.itemId,
    BasicCRUDActions.Read
  );

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(preset),
  };
};

export default getPresetPermissionsItem;

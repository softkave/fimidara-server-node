import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {PresetPermissionsItemUtils} from '../utils';
import {AddPresetPermissionsItemEndpoint} from './types';
import {addPresetPermissionsItemJoiSchema} from './validation';

const addPresetPermissionsItems: AddPresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, addPresetPermissionsItemJoiSchema);
  const user = await context.session.getUser(context, instData);
  const item = await context.data.presetPermissionsGroup.saveItem({
    ...data.item,
    presetId: getNewId(),
    createdAt: getDateString(),
    createdBy: user.userId,
  });

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default addPresetPermissionsItems;

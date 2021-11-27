import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {PresetPermissionsItemUtils} from '../utils';
import {GetPresetPermissionsItemEndpoint} from './types';
import {getPresetPermissionsItemJoiSchema} from './validation';

const getPresetPermissionsItem: GetPresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getPresetPermissionsItemJoiSchema);
  await context.session.getUser(context, instData);
  const item = await context.data.presetPermissionsGroup.assertGetItem(
    PresetPermissionsItemQueries.getById(data.itemId)
  );

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default getPresetPermissionsItem;

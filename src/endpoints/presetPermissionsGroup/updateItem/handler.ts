import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {PresetPermissionsItemUtils} from '../utils';
import {UpdatePresetPermissionsItemEndpoint} from './types';
import {updatePresetPermissionsItemJoiSchema} from './validation';

const updatePresetPermissionsItem: UpdatePresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updatePresetPermissionsItemJoiSchema);
  const user = await context.session.getUser(context, instData);
  const item = await context.data.presetPermissionsGroup.assertUpdateItem(
    PresetPermissionsItemQueries.getById(data.itemId),
    {
      ...data.data,
      lastUpdatedAt: getDateString(),
      lastUpdatedBy: user.userId,
    }
  );

  return {
    item: PresetPermissionsItemUtils.extractPublicPresetPermissionsItem(item),
  };
};

export default updatePresetPermissionsItem;

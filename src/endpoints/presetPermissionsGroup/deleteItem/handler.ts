import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {DeletePresetPermissionsItemEndpoint} from './types';
import {deletePresetPermissionsItemJoiSchema} from './validation';

const deletePresetPermissionsItem: DeletePresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePresetPermissionsItemJoiSchema);
  await context.session.getUser(context, instData);
  await context.data.presetPermissionsGroup.deleteItem(
    PresetPermissionsItemQueries.getById(data.itemId)
  );
};

export default deletePresetPermissionsItem;

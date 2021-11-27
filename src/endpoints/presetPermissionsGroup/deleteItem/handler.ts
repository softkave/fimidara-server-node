import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import PresetPermissionsItemQueries from '../queries';
import {checkPresetPermissionsGroupAuthorizationWithId} from '../utils';
import {DeletePresetPermissionsItemEndpoint} from './types';
import {deletePresetPermissionsItemJoiSchema} from './validation';

const deletePresetPermissionsItem: DeletePresetPermissionsItemEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePresetPermissionsItemJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorizationWithId(
    context,
    agent,
    data.itemId,
    BasicCRUDActions.Delete
  );

  await context.data.presetPermissionsGroup.deleteItem(
    PresetPermissionsItemQueries.getById(preset.presetId)
  );
};

export default deletePresetPermissionsItem;

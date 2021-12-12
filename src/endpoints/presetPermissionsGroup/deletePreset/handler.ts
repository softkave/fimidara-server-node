import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import PresetPermissionsGroupQueries from '../queries';
import {checkPresetPermissionsGroupAuthorization02} from '../utils';
import {DeletePresetPermissionsGroupEndpoint} from './types';
import {deletePresetPermissionsGroupJoiSchema} from './validation';

const deletePresetPermissionsGroup: DeletePresetPermissionsGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePresetPermissionsGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {preset} = await checkPresetPermissionsGroupAuthorization02(
    context,
    agent,
    data.presetId,
    BasicCRUDActions.Delete
  );

  await context.data.presetPermissionsGroup.deleteItem(
    PresetPermissionsGroupQueries.getById(preset.presetId)
  );
};

export default deletePresetPermissionsGroup;

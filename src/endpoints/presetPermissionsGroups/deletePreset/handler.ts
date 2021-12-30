import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import PermissionItemQueries from '../../permissionItems/queries';
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

  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        preset.presetId,
        AppResourceType.PresetPermissionsGroup
      )
    ),

    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        preset.presetId,
        AppResourceType.PresetPermissionsGroup
      )
    ),

    context.data.presetPermissionsGroup.deleteItem(
      PresetPermissionsGroupQueries.getById(preset.presetId)
    ),
  ]);
};

export default deletePresetPermissionsGroup;

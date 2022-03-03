import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import PermissionItemQueries from '../../permissionItems/queries';
import PresetPermissionsGroupQueries from '../queries';
import {checkPresetPermissionsGroupAuthorization03} from '../utils';
import {DeletePresetPermissionsGroupEndpoint} from './types';
import {deletePresetPermissionsGroupJoiSchema} from './validation';

/**
 * deletePresetPermissionsGroup.
 * Deletes a preset and related artifacts.
 *
 * Ensure that:
 * - Auth check
 * - Delete preset and artifacts
 */

const deletePresetPermissionsGroup: DeletePresetPermissionsGroupEndpoint =
  async (context, instData) => {
    const data = validate(instData.data, deletePresetPermissionsGroupJoiSchema);
    const agent = await context.session.getAgent(context, instData);
    const {preset} = await checkPresetPermissionsGroupAuthorization03(
      context,
      agent,
      data,
      BasicCRUDActions.Delete
    );

    await waitOnPromises([
      // Delete permission items that explicitly give access to this resource
      context.data.permissionItem.deleteManyItems(
        PermissionItemQueries.getByResource(
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      ),

      context.data.permissionItem.deleteManyItems(
        PermissionItemQueries.getByPermissionEntity(
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      ),

      context.data.preset.deleteItem(
        PresetPermissionsGroupQueries.getById(preset.resourceId)
      ),
    ]);
  };

export default deletePresetPermissionsGroup;

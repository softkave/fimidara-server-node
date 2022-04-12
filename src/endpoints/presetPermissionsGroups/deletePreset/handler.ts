import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {
  deleteAssignableItemAssignedItems,
  deleteResourceAssignedItems,
} from '../../assignedItems/deleteAssignedItems';
import {InvalidRequestError} from '../../errors';
import PermissionItemQueries from '../../permissionItems/queries';
import PresetPermissionsGroupQueries from '../queries';
import {checkPresetPermissionsGroupAuthorization03} from '../utils';
import {DeletePresetPermissionsGroupEndpoint} from './types';
import {deletePresetPermissionsGroupJoiSchema} from './validation';

const deletePresetPermissionsGroup: DeletePresetPermissionsGroupEndpoint =
  async (context, instData) => {
    const data = validate(instData.data, deletePresetPermissionsGroupJoiSchema);
    const agent = await context.session.getAgent(context, instData);
    const {preset, workspace} =
      await checkPresetPermissionsGroupAuthorization03(
        context,
        agent,
        data,
        BasicCRUDActions.Delete
      );

    if (preset.resourceId === workspace.publicPresetId) {
      throw new InvalidRequestError(
        "Cannot delete the workspace's public public preset"
      );
    }

    await waitOnPromises([
      // Delete permission items that explicitly give access to this resource
      context.data.permissionItem.deleteManyItems(
        PermissionItemQueries.getByResource(
          workspace.resourceId,
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      ),

      // Delete permission items owned by preset
      context.data.permissionItem.deleteManyItems(
        PermissionItemQueries.getByPermissionEntity(
          preset.resourceId,
          AppResourceType.PresetPermissionsGroup
        )
      ),

      // Delete preset assigned items
      deleteResourceAssignedItems(
        context,
        preset.workspaceId,
        preset.resourceId,
        AppResourceType.PresetPermissionsGroup
      ),

      // Remove references where preset is assigned
      deleteAssignableItemAssignedItems(
        context,
        preset.workspaceId,
        preset.resourceId,
        AppResourceType.PresetPermissionsGroup
      ),

      // Delete preset
      context.data.preset.deleteItem(
        PresetPermissionsGroupQueries.getById(preset.resourceId)
      ),
    ]);
  };

export default deletePresetPermissionsGroup;

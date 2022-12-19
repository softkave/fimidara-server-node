import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {
  deleteAssignableItemAssignedItems,
  deleteResourceAssignedItems,
} from '../../assignedItems/deleteAssignedItems';
import {InvalidRequestError} from '../../errors';
import PermissionItemQueries from '../../permissionItems/queries';
import PermissionGroupQueries from '../queries';
import {checkPermissionGroupAuthorization03} from '../utils';
import {DeletePermissionGroupEndpoint} from './types';
import {deletePermissionGroupJoiSchema} from './validation';

const deletePermissionGroup: DeletePermissionGroupEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, deletePermissionGroupJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {permissionGroup, workspace} =
    await checkPermissionGroupAuthorization03(
      context,
      agent,
      data,
      BasicCRUDActions.Delete
    );

  if (permissionGroup.resourceId === workspace.publicPermissionGroupId) {
    throw new InvalidRequestError(
      "Cannot delete the workspace's public public permission group"
    );
  }

  await waitOnPromises([
    // Delete permission items that explicitly give access to this resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        workspace.resourceId,
        permissionGroup.resourceId,
        AppResourceType.PermissionGroup
      )
    ),

    // Delete permission items owned by permissionGroup
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        permissionGroup.resourceId,
        AppResourceType.PermissionGroup
      )
    ),

    // Delete permissionGroup assigned items
    deleteResourceAssignedItems(
      context,
      permissionGroup.workspaceId,
      permissionGroup.resourceId,
      AppResourceType.PermissionGroup
    ),

    // Remove references where permissionGroup is assigned
    deleteAssignableItemAssignedItems(
      context,
      permissionGroup.workspaceId,
      permissionGroup.resourceId,
      AppResourceType.PermissionGroup
    ),

    // Delete permissionGroup
    context.data.permissiongroup.deleteItem(
      PermissionGroupQueries.getById(permissionGroup.resourceId)
    ),
  ]);
};

export default deletePermissionGroup;

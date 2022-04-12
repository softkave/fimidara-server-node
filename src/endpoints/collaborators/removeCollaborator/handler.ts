import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {getWorkspaceId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceId(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    BasicCRUDActions.Delete
  );

  await context.data.assignedItem.deleteItem(
    AssignedItemQueries.getByMainFields({
      workspaceId,
      assignedItemId: workspaceId,
      assignedItemType: AppResourceType.Workspace,
      assignedToItemId: collaborator.resourceId,
      assignedToItemType: AppResourceType.User,
    })
  );

  await waitOnPromises([
    // Delete permission items that belong to the resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    // Delete permission items that explicitly give access to the resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        workspaceId,
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    // Delete all presets, and user workspace data assigned
    deleteResourceAssignedItems(
      context,
      workspaceId,
      collaborator.resourceId,
      AppResourceType.User
    ),
  ]);
};

export default removeCollaborator;

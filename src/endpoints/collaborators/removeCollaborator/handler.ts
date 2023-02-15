import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    BasicCRUDActions.Delete
  );

  await context.data.assignedItem.deleteOneByQuery(
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
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByPermissionEntity(collaborator.resourceId)
    ),

    // Delete permission items that explicitly give access to the resource
    context.data.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(
        workspaceId,
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    // Delete all permissionGroups, and user workspace data assigned
    deleteResourceAssignedItems(
      context,
      workspaceId,
      collaborator.resourceId,
      AppResourceType.User
    ),
  ]);
};

export default removeCollaborator;

import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {noopAsync} from '../../../utils/fns';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {waitOnPromises} from '../../../utils/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import PermissionItemQueries from '../../permissionItems/queries';
import {DeleteResourceCascadeFnsMap} from '../../types';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

// TODO: delete client token and client token artifacts using provided resource ID
const cascade: DeleteResourceCascadeFnsMap = {
  [AppResourceType.All]: noopAsync,
  [AppResourceType.System]: noopAsync,
  [AppResourceType.Public]: noopAsync,
  [AppResourceType.Workspace]: noopAsync,
  [AppResourceType.CollaborationRequest]: noopAsync,
  [AppResourceType.ProgramAccessToken]: (context, id) =>
    context.semantic.programAccessToken.deleteOneById(id),
  [AppResourceType.ClientAssignedToken]: noopAsync,
  [AppResourceType.UserToken]: noopAsync,
  [AppResourceType.PermissionGroup]: noopAsync,
  [AppResourceType.PermissionItem]: async (context, id) => {
    await Promise.all([
      context.semantic.permissionItem.deleteManyByTargetId(id),
      context.semantic.permissionItem.deleteManyByEntityId(id),
    ]);
  },
  [AppResourceType.Folder]: noopAsync,
  [AppResourceType.File]: noopAsync,
  [AppResourceType.User]: noopAsync,
  [AppResourceType.Tag]: noopAsync,
  [AppResourceType.AssignedItem]: (context, id) =>
    context.semantic.assignedItem.deleteResourceAssignedItems(id),
  [AppResourceType.UsageRecord]: noopAsync,
  [AppResourceType.EndpointRequest]: noopAsync,
};

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
  await context.semantic.assignedItem.deleteOneByQuery(
    AssignedItemQueries.getByMainFields({
      workspaceId,
      assignedItemId: workspaceId,
      assignedToItemId: collaborator.resourceId,
    })
  );

  await waitOnPromises([
    // Delete permission items that belong to the resource
    context.semantic.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByPermissionEntity(collaborator.resourceId)
    ),

    // Delete permission items that explicitly give access to the resource
    context.semantic.permissionItem.deleteManyByQuery(
      PermissionItemQueries.getByResource(
        workspaceId,
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    // Delete all permissionGroups, and user workspace data assigned
    deleteResourceAssignedItems(context, workspaceId, collaborator.resourceId),
  ]);
};

export default removeCollaborator;

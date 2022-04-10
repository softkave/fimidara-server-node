import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {deleteResourceAssignedItems} from '../../assignedItems/deleteAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {getOrganizationId} from '../../contexts/SessionContext';
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
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Delete
  );

  await context.data.assignedItem.deleteItem(
    AssignedItemQueries.getByMainFields({
      organizationId,
      assignedItemId: organizationId,
      assignedItemType: AppResourceType.Organization,
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
        organizationId,
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    // Delete all presets, and user organization data assigned
    deleteResourceAssignedItems(
      context,
      organizationId,
      collaborator.resourceId,
      AppResourceType.User
    ),
  ]);
};

export default removeCollaborator;

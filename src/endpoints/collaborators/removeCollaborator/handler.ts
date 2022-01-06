import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import {getOrganizationId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import CollaboratorQueries from '../queries';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

/**
 * removeCollaborator. Ensure that:
 * - Check auth on agent
 * - Check that user is a part of organization
 * - Remove organization from collaborator
 * - Delete artifacts
 */

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

  collaborator.organizations = collaborator.organizations.filter(
    item => item.organizationId !== data.organizationId
  );

  await context.data.user.updateItem(
    CollaboratorQueries.getById(data.collaboratorId),
    {organizations: collaborator.organizations}
  );

  await waitOnPromises([
    // Delete permission items that belong to the resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByPermissionEntity(
        collaborator.userId,
        AppResourceType.Collaborator
      )
    ),

    // Delete permission items that explicitly give access to the resource
    context.data.permissionItem.deleteManyItems(
      PermissionItemQueries.getByResource(
        collaborator.userId,
        AppResourceType.Collaborator
      )
    ),

    context.data.collaborationRequest.deleteManyItems(
      CollaboratorQueries.getByOrganizationIdAndUserEmail(
        organizationId,
        collaborator.userId
      )
    ),
  ]);
};

export default removeCollaborator;

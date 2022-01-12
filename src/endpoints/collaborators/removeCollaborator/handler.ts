import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {waitOnPromises} from '../../../utilities/waitOnPromises';
import CollaborationRequestQueries from '../../collaborationRequests/queries';
import {getOrganizationId} from '../../contexts/SessionContext';
import PermissionItemQueries from '../../permissionItems/queries';
import EndpointReusableQueries from '../../queries';
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
    EndpointReusableQueries.getById(data.collaboratorId),
    {organizations: collaborator.organizations}
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
        collaborator.resourceId,
        AppResourceType.User
      )
    ),

    context.data.collaborationRequest.deleteManyItems(
      CollaborationRequestQueries.getByOrganizationIdAndUserEmail(
        organizationId,
        collaborator.email
      )
    ),
  ]);
};

export default removeCollaborator;

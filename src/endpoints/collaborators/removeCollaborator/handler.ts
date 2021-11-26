import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForCollaborator} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaboratorQueries from '../queries';
import {RemoveCollaboratorEndpoint} from './types';
import {removeCollaboratorJoiSchema} from './validation';

const removeCollaborator: RemoveCollaboratorEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const collaborator = await context.data.user.assertGetItem(
    CollaboratorQueries.getByOrganizationIdAndUserId(
      data.organizationId,
      data.collaboratorId
    )
  );

  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorizationForCollaborator(
    context,
    agent,
    organization.organizationId,
    collaborator,
    BasicCRUDActions.Delete
  );

  collaborator.organizations = collaborator.organizations.filter(
    item => item.organizationId !== data.organizationId
  );

  await context.data.user.updateItem(
    CollaboratorQueries.getById(data.collaboratorId),
    {organizations: collaborator.organizations}
  );
};

export default removeCollaborator;

import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import CollaboratorQueries from '../queries';
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
    BasicCRUDActions.Read
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

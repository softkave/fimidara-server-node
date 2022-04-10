import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
import {getOrganizationId} from '../../contexts/SessionContext';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserOrgs,
} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

const getCollaborator: GetCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);

  // checkCollaboratorAuthorization fills in the user organizations
  let {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Read
  );

  return {
    collaborator: collaboratorExtractor(
      removeOtherUserOrgs(collaborator, organizationId),
      organizationId
    ),
  };
};

export default getCollaborator;

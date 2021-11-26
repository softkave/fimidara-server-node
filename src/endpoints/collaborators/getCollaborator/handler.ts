import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {checkAuthorizationForCollaborator} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaboratorQueries from '../queries';
import {collaboratorExtractor} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

const getCollaborator: GetCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
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
    BasicCRUDActions.Read
  );

  const publicData = collaboratorExtractor(collaborator);
  return {
    collaborator: publicData,
  };
};

export default getCollaborator;

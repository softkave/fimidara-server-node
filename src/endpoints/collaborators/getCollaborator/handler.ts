import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utilities/validate';
import {getOrganizationId} from '../../contexts/SessionContext';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

/**
 * getCollaborator. Ensure that:
 * - Check auth
 * - Return collaborator if exists
 */

const getCollaborator: GetCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    organizationId,
    data.collaboratorId,
    BasicCRUDActions.Read
  );

  const publicData = collaboratorExtractor(collaborator);
  return {
    collaborator: publicData,
  };
};

export default getCollaborator;

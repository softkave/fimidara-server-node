import {BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {getWorkspaceIdFromSessionAgent} from '../../contexts/SessionContext';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserWorkspaces,
} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

const getCollaborator: GetCollaboratorEndpoint = async (context, instData) => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);

  // checkCollaboratorAuthorization fills in the user workspaces
  const {collaborator} = await checkCollaboratorAuthorization02(
    context,
    agent,
    workspaceId,
    data.collaboratorId,
    BasicCRUDActions.Read
  );

  return {
    collaborator: collaboratorExtractor(
      removeOtherUserWorkspaces(collaborator, workspaceId),
      workspaceId
    ),
  };
};

export default getCollaborator;

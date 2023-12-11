import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injectables';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserWorkspaces,
} from '../utils';
import {GetCollaboratorEndpoint} from './types';
import {getCollaboratorJoiSchema} from './validation';

const getCollaborator: GetCollaboratorEndpoint = async instData => {
  const data = validate(instData.data, getCollaboratorJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);

  // checkCollaboratorAuthorization fills in the user workspaces
  const {collaborator} = await checkCollaboratorAuthorization02(
    agent,
    workspaceId,
    data.collaboratorId,
    'readCollaborator'
  );

  return {
    collaborator: collaboratorExtractor(
      removeOtherUserWorkspaces(collaborator, workspaceId),
      workspaceId
    ),
  };
};

export default getCollaborator;

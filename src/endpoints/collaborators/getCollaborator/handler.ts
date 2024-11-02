import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {
  checkCollaboratorAuthorization02,
  collaboratorExtractor,
  removeOtherUserWorkspaces,
} from '../utils.js';
import {GetCollaboratorEndpoint} from './types.js';
import {getCollaboratorJoiSchema} from './validation.js';

const getCollaborator: GetCollaboratorEndpoint = async reqData => {
  const data = validate(reqData.data, getCollaboratorJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
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

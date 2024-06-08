import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkCollaboratorAuthorization02} from '../utils.js';
import {RemoveCollaboratorEndpoint} from './types.js';
import {beginDeleteCollaborator} from './utils.js';
import {removeCollaboratorJoiSchema} from './validation.js';

const removeCollaborator: RemoveCollaboratorEndpoint = async instData => {
  const data = validate(instData.data, removeCollaboratorJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    agent,
    workspaceId,
    data.collaboratorId,
    kFimidaraPermissionActionsMap.removeCollaborator
  );

  const [job] = await beginDeleteCollaborator({
    agent,
    workspaceId,
    resources: [collaborator],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default removeCollaborator;

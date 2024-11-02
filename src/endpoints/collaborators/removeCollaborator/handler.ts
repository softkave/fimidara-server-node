import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {checkCollaboratorAuthorization02} from '../utils.js';
import {RemoveCollaboratorEndpoint} from './types.js';
import {beginDeleteCollaborator} from './utils.js';
import {removeCollaboratorJoiSchema} from './validation.js';

const removeCollaborator: RemoveCollaboratorEndpoint = async reqData => {
  const data = validate(reqData.data, removeCollaboratorJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const workspaceId = getWorkspaceIdFromSessionAgent(agent, data.workspaceId);
  const {collaborator} = await checkCollaboratorAuthorization02(
    agent,
    workspaceId,
    data.collaboratorId,
    kFimidaraPermissionActions.removeCollaborator
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

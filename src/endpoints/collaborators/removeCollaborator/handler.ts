import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {getWorkspaceIdFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkCollaboratorAuthorization02} from '../utils';
import {RemoveCollaboratorEndpoint} from './types';
import {beginDeleteCollaborator} from './utils';
import {removeCollaboratorJoiSchema} from './validation';

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

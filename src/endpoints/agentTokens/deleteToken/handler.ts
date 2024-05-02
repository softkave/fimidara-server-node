import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {checkAgentTokenAuthorization02} from '../utils.js';
import {DeleteAgentTokenEndpoint} from './types.js';
import {beginDeleteAgentToken} from './utils.js';
import {deleteAgentTokenJoiSchema} from './validation.js';

const deleteAgentToken: DeleteAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    kFimidaraPermissionActionsMap.deleteAgentToken
  );
  const workspaceId = token.workspaceId;
  appAssert(workspaceId);

  const [job] = await beginDeleteAgentToken({
    agent,
    workspaceId,
    resources: [token],
  });
  appAssert(job);

  return {jobId: job.resourceId};
};

export default deleteAgentToken;

import {kPermissionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {checkAgentTokenAuthorization02} from '../utils';
import {DeleteAgentTokenEndpoint} from './types';
import {beginDeleteAgentToken} from './utils';
import {deleteAgentTokenJoiSchema} from './validation';

const deleteAgentToken: DeleteAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, deleteAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    kPermissionsMap.deleteAgentToken
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

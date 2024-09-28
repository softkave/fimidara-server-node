import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../../contexts/injection/injectables.js';
import {appAssert} from '../../../utils/assertion.js';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {checkAgentTokenAuthorization02, getPublicAgentToken} from '../utils.js';
import {GetAgentTokenEndpoint} from './types.js';
import {getAgentTokenJoiSchema} from './validation.js';

const getAgentToken: GetAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, getAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  let {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    'readAgentToken'
  );
  appAssert(token.workspaceId);
  token = await populateAssignedTags(token.workspaceId, token);
  return {token: getPublicAgentToken(token)};
};

export default getAgentToken;

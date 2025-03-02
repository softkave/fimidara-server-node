import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
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
  const agent = await kIjxUtils
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
    kFimidaraPermissionActions.readAgentToken
  );

  appAssert(token.workspaceId);
  token = await populateAssignedTags(token.workspaceId, token);

  return {token: await getPublicAgentToken(token, data.shouldEncode ?? false)};
};

export default getAgentToken;

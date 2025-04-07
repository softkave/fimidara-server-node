import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {tryGetAgentTokenId} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {tryGetWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {
  checkAgentTokenAuthorization02,
  encodeAgentToken as encodePublicAgentToken,
} from '../utils.js';
import {EncodeAgentTokenEndpoint} from './types.js';
import {encodeAgentTokenJoiSchema} from './validation.js';

const encodeAgentToken: EncodeAgentTokenEndpoint = async reqData => {
  const data = validate(reqData.data, encodeAgentTokenJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const {workspace} = await tryGetWorkspaceFromEndpointInput(agent, data);
  const tokenId = tryGetAgentTokenId(agent, data.tokenId, data.onReferenced);
  const {token} = await checkAgentTokenAuthorization02(
    agent,
    workspace?.resourceId,
    tokenId,
    data.providedResourceId,
    kFimidaraPermissionActions.readAgentToken
  );

  return await encodePublicAgentToken(token);
};

export default encodeAgentToken;

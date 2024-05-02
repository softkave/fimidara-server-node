import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getPublicAgentToken} from '../utils.js';
import {AddAgentTokenEndpoint} from './types.js';
import {INTERNAL_createAgentToken} from './utils.js';
import {addAgentTokenJoiSchema} from './validation.js';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {
      action: kFimidaraPermissionActionsMap.addAgentToken,
      targetId: workspace.resourceId,
    },
  });

  const token = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_createAgentToken(agent, workspace, data.token, opts);
  }, /** reuseTxn */ false);

  appAssert(token.workspaceId);
  return {token: getPublicAgentToken(token)};
};

export default addAgentTokenEndpoint;

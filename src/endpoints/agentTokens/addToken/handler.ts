import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {AddAgentTokenEndpoint} from './types';
import {INTERNAL_createAgentToken} from './utils';
import {addAgentTokenJoiSchema} from './validation';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async instData => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'addAgentToken', targetId: workspace.resourceId},
  });

  const token = await kSemanticModels.utils().withTxn(async opts => {
    return await INTERNAL_createAgentToken(agent, workspace, data.token, opts);
  });

  appAssert(token.workspaceId);
  return {token: getPublicAgentToken(token)};
};

export default addAgentTokenEndpoint;

import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {AddAgentTokenEndpoint} from './types';
import {INTERNAL_createAgentToken} from './utils';
import {addAgentTokenJoiSchema} from './validation';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorizationWithAgent({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'addAgentToken', targetId: workspace.resourceId},
  });
  const token = await context.semantic.utils.withTxn(context, async opts => {
    return await INTERNAL_createAgentToken(context, agent, workspace, data.token, opts);
  });
  appAssert(token.workspaceId);
  return {token: getPublicAgentToken(context, token)};
};

export default addAgentTokenEndpoint;

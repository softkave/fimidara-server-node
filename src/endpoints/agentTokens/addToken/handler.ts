import {AppActionType, AppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {AddAgentTokenEndpoint} from './types';
import {INTERNAL_createAgentToken} from './utils';
import {addAgentTokenJoiSchema} from './validation';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    targets: {targetType: AppResourceType.AgentToken},
    action: AppActionType.Create,
  });
  const token = await context.semantic.utils.withTxn(context, async opts => {
    return await INTERNAL_createAgentToken(context, agent, workspace, data.token, opts);
  });
  appAssert(token.workspaceId);
  const agentToken = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicAgentToken(context, agentToken)};
};

export default addAgentTokenEndpoint;

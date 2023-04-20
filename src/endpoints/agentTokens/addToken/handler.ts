import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {MemStore} from '../../contexts/mem/Mem';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {AddAgentTokenEndpoint} from './types';
import {internalCreateAgentToken} from './utils';
import {addAgentTokenJoiSchema} from './validation';

const addAgentTokenEndpoint: AddAgentTokenEndpoint = async (context, instData) => {
  const data = validate(instData.data, addAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const token = await MemStore.withTransaction(context, async transaction => {
    return await internalCreateAgentToken(context, agent, workspace, data.token, {transaction});
  });
  appAssert(token.workspaceId);
  const agentToken = await populateAssignedTags(context, token.workspaceId, token);
  return {token: getPublicAgentToken(context, agentToken)};
};

export default addAgentTokenEndpoint;

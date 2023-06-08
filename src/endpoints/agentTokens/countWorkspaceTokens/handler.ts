import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceAgentTokensQuery} from '../getWorkspaceTokens/utils';
import {CountWorkspaceAgentTokensEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countWorkspaceAgentTokens: CountWorkspaceAgentTokensEndpoint = async (context, instData) => {
  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspaceAgentTokensQuery(context, agent, workspace);
  const count = await context.semantic.agentToken.countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceAgentTokens;

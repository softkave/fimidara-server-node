import {validate} from '../../../utils/validate';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {GetWorkspaceAgentTokensEndpoint} from './types';
import {getWorkspaceAgentTokensQuery} from './utils';
import {getWorkspaceAgentTokenJoiSchema} from './validation';

const getWorkspaceAgentTokens: GetWorkspaceAgentTokensEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspaceAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const q = await getWorkspaceAgentTokensQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const tokens = await context.semantic.agentToken.getManyByWorkspaceAndIdList(q, data);
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicAgentToken(context, token)),
  };
};

export default getWorkspaceAgentTokens;

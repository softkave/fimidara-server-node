import {validate} from '../../../utils/validate';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceAgentTokensQuery} from '../getWorkspaceTokens/utils';
import {CountWorkspaceAgentTokensEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countWorkspaceAgentTokens: CountWorkspaceAgentTokensEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const q = await getWorkspaceAgentTokensQuery(agent, workspace);
  const count = await kSemanticModels.agentToken().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceAgentTokens;

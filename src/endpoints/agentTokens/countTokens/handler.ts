import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getAgentTokensQuery} from '../getTokens/utils.js';
import {CountAgentTokensEndpoint} from './types.js';
import {countAgentTokenJoiSchema} from './validation.js';

const countAgentTokensEndpoint: CountAgentTokensEndpoint = async reqData => {
  const data = validate(reqData.data, countAgentTokenJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {data});

  const q = await getAgentTokensQuery(agent, workspace);
  const count = await kSemanticModels
    .agentToken()
    .countManyByWorkspaceAndIdList(q);

  return {count};
};

export default countAgentTokensEndpoint;

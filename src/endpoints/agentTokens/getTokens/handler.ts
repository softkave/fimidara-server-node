import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getPublicAgentToken} from '../utils.js';
import {GetAgentTokensEndpoint} from './types.js';
import {getAgentTokensQuery} from './utils.js';
import {getAgentTokenJoiSchema} from './validation.js';

const getAgentTokensEndpoint: GetAgentTokensEndpoint = async reqData => {
  const data = validate(reqData.data, getAgentTokenJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const q = await getAgentTokensQuery(agent, workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const tokens = await kSemanticModels
    .agentToken()
    .getManyByWorkspaceAndIdList(q, data);

  return {
    page: getEndpointPageFromInput(data),
    tokens: await Promise.all(
      tokens.map(token =>
        getPublicAgentToken(token, data.shouldEncode ?? false)
      )
    ),
  };
};

export default getAgentTokensEndpoint;

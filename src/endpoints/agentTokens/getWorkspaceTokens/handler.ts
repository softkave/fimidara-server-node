import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getPublicAgentToken} from '../utils';
import {GetWorkspaceAgentTokensEndpoint} from './types';
import {getWorkspaceAgentTokensQuery} from './utils';
import {getWorkspaceAgentTokenJoiSchema} from './validation';

const getWorkspaceAgentTokens: GetWorkspaceAgentTokensEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const q = await getWorkspaceAgentTokensQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const tokens = await kSemanticModels.agentToken().getManyByWorkspaceAndIdList(q, data);
  return {
    page: getEndpointPageFromInput(data),
    tokens: tokens.map(token => getPublicAgentToken(token)),
  };
};

export default getWorkspaceAgentTokens;

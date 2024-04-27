import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getWorkspaceAgentTokensQuery} from '../getWorkspaceTokens/utils';
import {CountWorkspaceAgentTokensEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countWorkspaceAgentTokens: CountWorkspaceAgentTokensEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const q = await getWorkspaceAgentTokensQuery(agent, workspace);
  const count = await kSemanticModels.agentToken().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceAgentTokens;

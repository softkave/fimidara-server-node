import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getWorkspaceAgentTokensQuery} from '../getWorkspaceTokens/utils.js';
import {CountWorkspaceAgentTokensEndpoint} from './types.js';
import {countWorkspaceAgentTokenJoiSchema} from './validation.js';

const countWorkspaceAgentTokens: CountWorkspaceAgentTokensEndpoint =
  async reqData => {
    const data = validate(reqData.data, countWorkspaceAgentTokenJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentType.api,
        kSessionUtils.accessScope.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceAgentTokensQuery(agent, workspace);
    const count = await kSemanticModels
      .agentToken()
      .countManyByWorkspaceAndIdList(q);
    return {count};
  };

export default countWorkspaceAgentTokens;

import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getPublicAgentToken} from '../utils.js';
import {GetWorkspaceAgentTokensEndpoint} from './types.js';
import {getWorkspaceAgentTokensQuery} from './utils.js';
import {getWorkspaceAgentTokenJoiSchema} from './validation.js';

const getWorkspaceAgentTokens: GetWorkspaceAgentTokensEndpoint =
  async reqData => {
    const data = validate(reqData.data, getWorkspaceAgentTokenJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );

    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const q = await getWorkspaceAgentTokensQuery(agent, workspace);
    applyDefaultEndpointPaginationOptions(data);
    const tokens = await kIjxSemantic
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

export default getWorkspaceAgentTokens;

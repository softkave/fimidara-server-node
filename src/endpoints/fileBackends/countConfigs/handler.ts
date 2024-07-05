import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getFileBackendConfigsQuery} from '../getConfigs/utils.js';
import {CountFileBackendConfigsEndpoint} from './types.js';
import {countWorkspaceAgentTokenJoiSchema} from './validation.js';

const countFileBackendConfigs: CountFileBackendConfigsEndpoint =
  async reqData => {
    const configModel = kSemanticModels.fileBackendConfig();
    const data = validate(reqData.data, countWorkspaceAgentTokenJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    const query = await getFileBackendConfigsQuery(agent, workspace, data);
    const count = await configModel.countByQuery(query);

    return {count};
  };

export default countFileBackendConfigs;

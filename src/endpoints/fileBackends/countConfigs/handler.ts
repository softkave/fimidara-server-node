import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getFileBackendConfigsQuery} from '../getConfigs/utils.js';
import {CountFileBackendConfigsEndpoint} from './types.js';
import {countWorkspaceAgentTokenJoiSchema} from './validation.js';

const countFileBackendConfigs: CountFileBackendConfigsEndpoint =
  async reqData => {
    const configModel = kIjxSemantic.fileBackendConfig();
    const data = validate(reqData.data, countWorkspaceAgentTokenJoiSchema);
    const agent = await kIjxUtils
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

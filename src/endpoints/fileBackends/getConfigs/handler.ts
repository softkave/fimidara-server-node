import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {fileBackendConfigListExtractor} from '../utils.js';
import {GetFileBackendConfigsEndpoint} from './types.js';
import {getFileBackendConfigsQuery} from './utils.js';
import {getFileBackendConfigsJoiSchema} from './validation.js';

const getFileBackendConfigs: GetFileBackendConfigsEndpoint = async reqData => {
  const configModel = kIjxSemantic.fileBackendConfig();
  const data = validate(reqData.data, getFileBackendConfigsJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendConfigsQuery(agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const configs = await configModel.getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    configs: fileBackendConfigListExtractor(configs),
  };
};

export default getFileBackendConfigs;

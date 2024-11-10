import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendConfigListExtractor} from '../utils.js';
import {GetFileBackendConfigsEndpoint} from './types.js';
import {getFileBackendConfigsQuery} from './utils.js';
import {getFileBackendConfigsJoiSchema} from './validation.js';

const getFileBackendConfigs: GetFileBackendConfigsEndpoint = async reqData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const data = validate(reqData.data, getFileBackendConfigsJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const query = await getFileBackendConfigsQuery(agent, workspaceId, data);
  applyDefaultEndpointPaginationOptions(data);
  const configs = await configModel.getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    configs: fileBackendConfigListExtractor(configs),
  };
};

export default getFileBackendConfigs;

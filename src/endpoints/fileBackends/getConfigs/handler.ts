import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigListExtractor} from '../utils';
import {GetFileBackendConfigsEndpoint} from './types';
import {getFileBackendConfigsQuery} from './utils';
import {getFileBackendConfigsJoiSchema} from './validation';

const getFileBackendConfigs: GetFileBackendConfigsEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();
  const data = validate(instData.data, getFileBackendConfigsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
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

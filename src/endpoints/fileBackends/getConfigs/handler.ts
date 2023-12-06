import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../utils';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {fileBackendConfigListExtractor} from '../utils';
import {GetFileBackendConfigsEndpoint} from './types';
import {getFileBackendConfigsQuery} from './utils';
import {getWorkspaceFileBackendConfigJoiSchema} from './validation';

const getFileBackendConfigs: GetFileBackendConfigsEndpoint = async (
  context,
  instData
) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const data = validate(instData.data, getWorkspaceFileBackendConfigJoiSchema);
  const agent = await context.session.getAgent(context, instData);
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

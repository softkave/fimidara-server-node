import {container} from 'tsyringe';
import {validate} from '../../../utils/validate';
import {kInjectionKeys} from '../../contexts/injection';
import {SemanticFileBackendConfigProvider} from '../../contexts/semantic/fileBackendConfig/types';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFileBackendConfigsQuery} from '../getConfigs/utils';
import {CountFileBackendConfigsEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countFileBackendConfigs: CountFileBackendConfigsEndpoint = async (
  context,
  instData
) => {
  const configModel = container.resolve<SemanticFileBackendConfigProvider>(
    kInjectionKeys.semantic.fileBackendConfig
  );

  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendConfigsQuery(agent, workspace, data);
  const count = await configModel.countByQuery(query);

  return {count};
};

export default countFileBackendConfigs;

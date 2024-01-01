import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFileBackendConfigsQuery} from '../getConfigs/utils';
import {CountFileBackendConfigsEndpoint} from './types';
import {countWorkspaceAgentTokenJoiSchema} from './validation';

const countFileBackendConfigs: CountFileBackendConfigsEndpoint = async instData => {
  const configModel = kSemanticModels.fileBackendConfig();

  const data = validate(instData.data, countWorkspaceAgentTokenJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendConfigsQuery(agent, workspace, data);
  const count = await configModel.countByQuery(query);

  return {count};
};

export default countFileBackendConfigs;

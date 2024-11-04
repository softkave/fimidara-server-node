import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getFileBackendConfigsQuery} from '../getConfigs/utils.js';
import {CountFileBackendConfigsEndpoint} from './types.js';
import {countWorkspaceAgentTokenJoiSchema} from './validation.js';

const countFileBackendConfigs: CountFileBackendConfigsEndpoint =
  async reqData => {
    const configModel = kSemanticModels.fileBackendConfig();
    const data = validate(reqData.data, countWorkspaceAgentTokenJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {data});

    const query = await getFileBackendConfigsQuery(agent, workspace, data);
    const count = await configModel.countByQuery(query);

    return {count};
  };

export default countFileBackendConfigs;

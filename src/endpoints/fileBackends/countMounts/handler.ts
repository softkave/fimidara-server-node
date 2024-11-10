import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getFileBackendMountsQuery} from '../getMounts/utils.js';
import {CountFileBackendMountsEndpoint} from './types.js';
import {countFileBackendMountsJoiSchema} from './validation.js';

const countFileBackendMounts: CountFileBackendMountsEndpoint =
  async reqData => {
    const mountModel = kSemanticModels.fileBackendMount();
    const data = validate(reqData.data, countFileBackendMountsJoiSchema);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const query = await getFileBackendMountsQuery(agent, workspaceId, data);
    const count = await mountModel.countByQuery(query);

    return {count};
  };

export default countFileBackendMounts;

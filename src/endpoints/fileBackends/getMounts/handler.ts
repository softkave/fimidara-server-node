import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {fileBackendMountListExtractor} from '../utils.js';
import {GetFileBackendMountsEndpoint} from './types.js';
import {getFileBackendMountsQuery} from './utils.js';
import {getFileBackendMountsJoiSchema} from './validation.js';

const getFileBackendMounts: GetFileBackendMountsEndpoint = async reqData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(reqData.data, getFileBackendMountsJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {data});

  const query = await getFileBackendMountsQuery(agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const mounts = await mountModel.getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default getFileBackendMounts;

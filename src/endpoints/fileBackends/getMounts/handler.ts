import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {fileBackendMountListExtractor} from '../utils.js';
import {GetFileBackendMountsEndpoint} from './types.js';
import {getFileBackendMountsQuery} from './utils.js';
import {getFileBackendMountsJoiSchema} from './validation.js';

const getFileBackendMounts: GetFileBackendMountsEndpoint = async reqData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(reqData.data, getFileBackendMountsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentType.api,
      kSessionUtils.accessScope.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendMountsQuery(agent, workspace, data);
  applyDefaultEndpointPaginationOptions(data);
  const mounts = await mountModel.getManyByQuery(query, data);

  return {
    page: getEndpointPageFromInput(data),
    mounts: fileBackendMountListExtractor(mounts),
  };
};

export default getFileBackendMounts;

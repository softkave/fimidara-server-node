import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {fileBackendMountListExtractor} from '../utils.js';
import {GetFileBackendMountsEndpoint} from './types.js';
import {getFileBackendMountsQuery} from './utils.js';
import {getFileBackendMountsJoiSchema} from './validation.js';

const getFileBackendMounts: GetFileBackendMountsEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, getFileBackendMountsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
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

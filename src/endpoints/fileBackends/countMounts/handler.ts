import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {getFileBackendMountsQuery} from '../getMounts/utils.js';
import {CountFileBackendMountsEndpoint} from './types.js';
import {countFileBackendMountsJoiSchema} from './validation.js';

const countFileBackendMounts: CountFileBackendMountsEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, countFileBackendMountsJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendMountsQuery(agent, workspace, data);
  const count = await mountModel.countByQuery(query);

  return {count};
};

export default countFileBackendMounts;

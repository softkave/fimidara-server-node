import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFileBackendMountsQuery} from '../getMounts/utils';
import {CountFileBackendMountsEndpoint} from './types';
import {countFileBackendMountsJoiSchema} from './validation';

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

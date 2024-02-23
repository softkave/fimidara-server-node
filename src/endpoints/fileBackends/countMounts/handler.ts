import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {getFileBackendMountsQuery} from '../getMounts/utils';
import {CountFileBackendMountsEndpoint} from './types';
import {countFileBackendMountsJoiSchema} from './validation';

const countFileBackendMounts: CountFileBackendMountsEndpoint = async instData => {
  const mountModel = kSemanticModels.fileBackendMount();
  const data = validate(instData.data, countFileBackendMountsJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
  const query = await getFileBackendMountsQuery(agent, workspace, data);
  const count = await mountModel.countByQuery(query);

  return {count};
};

export default countFileBackendMounts;

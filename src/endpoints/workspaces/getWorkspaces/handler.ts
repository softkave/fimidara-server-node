import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {workspaceListExtractor} from '../utils.js';
import {GetWorkspacesEndpoint} from './types.js';
import {getWorkspaceListQuery} from './utils.js';
import {getWorkspacesJoiSchema} from './validation.js';

const getWorkspacesEndpoint: GetWorkspacesEndpoint = async reqData => {
  const data = validate(reqData.data, getWorkspacesJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const q = await getWorkspaceListQuery(agent, workspaceId);
  applyDefaultEndpointPaginationOptions(data);
  const workspaces = await kSemanticModels
    .workspace()
    .getManyByWorkspaceAndIdList(q, data);

  return {
    page: getEndpointPageFromInput(data),
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getWorkspacesEndpoint;

import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {getWorkspaceListQuery} from '../getWorkspaces/utils.js';
import {CountWorkspacesEndpoint} from './types.js';
import {countWorkspacesJoiSchema} from './validation.js';

const countWorkspacesEndpoint: CountWorkspacesEndpoint = async reqData => {
  const data = validate(reqData.data, countWorkspacesJoiSchema);
  const {agent, workspaceId} = await initEndpoint(reqData, {data});

  const q = await getWorkspaceListQuery(agent, workspaceId);
  const count = await kSemanticModels
    .workspace()
    .countManyByWorkspaceAndIdList(q);

  return {count};
};

export default countWorkspacesEndpoint;

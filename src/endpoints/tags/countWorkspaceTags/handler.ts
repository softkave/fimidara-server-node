import {validate} from '../../../utils/validate';
import {kUtilsInjectables, kSemanticModels} from '../../contexts/injectables';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {getWorkspaceTagsQuery} from '../getWorkspaceTags/utils';
import {CountWorkspaceTagsEndpoint} from './types';
import {countWorkspaceTagJoiSchema} from './validation';

const countWorkspaceTags: CountWorkspaceTagsEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceTagJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspace = await checkWorkspaceExistsWithAgent(agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(agent, workspace);
  const count = await kSemanticModels.tag().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceTags;

import {validate} from '../../../utils/validate';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagsEndpoint} from './types';
import {getWorkspaceTagsQuery} from './utils';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const tags = await context.semantic.tag.getManyByWorkspaceAndIdList(q, data);
  return {tags: tags.map(tag => tagExtractor(tag)), page: getEndpointPageFromInput(data)};
};

export default getWorkspaceTags;

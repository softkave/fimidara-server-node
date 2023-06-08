import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagsEndpoint} from './types';
import {getWorkspaceTagsQuery} from './utils';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagsEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(context, agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  let tags = await context.semantic.tag.getManyByWorkspaceAndIdList(q, data);
  return {tags: tags.map(tag => tagExtractor(tag)), page: getEndpointPageFromInput(data)};
};

export default getWorkspaceTags;

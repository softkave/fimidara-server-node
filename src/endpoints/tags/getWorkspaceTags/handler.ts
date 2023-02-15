import {validate} from '../../../utils/validate';
import {getEndpointPageFromInput} from '../../utils';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagEndpoint} from './types';
import {getWorkspaceTagsQuery} from './utils';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(context, agent, workspace);
  let tags = await context.data.tag.getManyByQuery(q, data);
  tags = tags.map(tag => tagExtractor(tag));
  return {tags, page: getEndpointPageFromInput(data)};
};

export default getWorkspaceTags;

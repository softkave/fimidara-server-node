import {validate} from '../../../utils/validate';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {getWorkspaceTagsQuery} from '../getWorkspaceTags/utils';
import {GetWorkspaceTagEndpoint} from './types';
import {countWorkspaceTagJoiSchema} from './validation';

const countWorkspaceTags: GetWorkspaceTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, countWorkspaceTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(context, agent, workspace);
  const count = await context.semantic.tag.countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceTags;

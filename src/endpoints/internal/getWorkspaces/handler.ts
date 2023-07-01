import {AppResourceType} from '../../../definitions/system';
import {workspaceListExtractor} from '../../workspaces/utils';
import {assertUserIsPartOfRootWorkspace} from '../utils';
import {GetWorkspacesEndpoint} from './types';

const getWorkspaces: GetWorkspacesEndpoint = async (context, instData) => {
  const agent = await context.session.getAgent(context, instData, [AppResourceType.User]);
  await assertUserIsPartOfRootWorkspace(context, agent);
  const workspaceList = await context.semantic.workspace.getManyByQuery({});
  return {workspaceList: workspaceListExtractor(workspaceList)};
};

export default getWorkspaces;

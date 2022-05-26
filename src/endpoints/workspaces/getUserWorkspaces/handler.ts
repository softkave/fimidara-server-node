import {workspaceListExtractor} from '../utils';
import {GetUserWorkspacesEndpoint} from './types';

const getUserWorkspaces: GetUserWorkspacesEndpoint = async (
  context,
  instData
) => {
  const user = await context.session.getUser(context, instData);
  const workspaces = await context.cacheProviders.workspace.getByIds(
    context,
    user.workspaces.map(workspace => workspace.workspaceId)
  );

  return {
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getUserWorkspaces;

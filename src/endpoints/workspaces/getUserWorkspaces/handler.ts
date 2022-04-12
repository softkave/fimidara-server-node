import WorkspaceQueries from '../queries';
import {workspaceListExtractor} from '../utils';
import {GetUserWorkspacesEndpoint} from './types';

const getUserWorkspaces: GetUserWorkspacesEndpoint = async (
  context,
  instData
) => {
  const user = await context.session.getUser(context, instData);
  const workspaces = await context.data.workspace.getManyItems(
    WorkspaceQueries.getByIds(
      user.workspaces.map(workspace => workspace.workspaceId)
    )
  );

  return {
    workspaces: workspaceListExtractor(workspaces),
  };
};

export default getUserWorkspaces;

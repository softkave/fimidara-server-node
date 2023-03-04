import {CountUserWorkspacesEndpoint} from './types';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async (context, d) => {
  const user = await context.session.getUser(context, d);
  const count = await context.semantic.workspace.countManyByIdList(
    user.workspaces.map(workspace => workspace.workspaceId)
  );
  return {count};
};

export default countUserWorkspaces;

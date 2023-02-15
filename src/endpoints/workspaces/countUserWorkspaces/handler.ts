import EndpointReusableQueries from '../../queries';
import {CountUserWorkspacesEndpoint} from './types';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async (context, d) => {
  const user = await context.session.getUser(context, d);
  const count = await context.data.workspace.countByQuery(
    EndpointReusableQueries.getByResourceIdList(
      user.workspaces.map(workspace => workspace.workspaceId)
    )
  );
  return {count};
};

export default countUserWorkspaces;

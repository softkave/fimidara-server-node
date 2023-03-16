import {AppResourceType} from '../../../definitions/system';
import {CountUserWorkspacesEndpoint} from './types';

const countUserWorkspaces: CountUserWorkspacesEndpoint = async (context, d) => {
  const user = await context.session.getUser(context, d);
  const assignedItems = await context.semantic.assignedItem.getResourceAssignedItems(
    user.resourceId,
    AppResourceType.Workspace
  );
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const count = await context.semantic.workspace.countManyByIdList(workspaceIdList);
  return {count};
};

export default countUserWorkspaces;

import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {applyDefaultEndpointPaginationOptions, getEndpointPageFromInput} from '../../utils';
import {workspaceListExtractor} from '../utils';
import {GetUserWorkspacesEndpoint} from './types';
import {getUserWorkspacesJoiSchema} from './validation';

const getUserWorkspaces: GetUserWorkspacesEndpoint = async (context, d) => {
  const data = validate(d.data, getUserWorkspacesJoiSchema);
  const user = await context.session.getUser(context, d);
  applyDefaultEndpointPaginationOptions(data);
  const assignedItems = await context.semantic.assignedItem.getResourceAssignedItems(
    user.resourceId,
    AppResourceType.Workspace
  );
  const workspaceIdList = assignedItems.map(item => item.assignedItemId);
  const workspaces = await context.semantic.workspace.getManyByIdList(workspaceIdList, data);
  return {page: getEndpointPageFromInput(data), workspaces: workspaceListExtractor(workspaces)};
};

export default getUserWorkspaces;

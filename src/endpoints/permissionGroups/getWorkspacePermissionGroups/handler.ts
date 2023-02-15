import {AppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {populateResourceListWithAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {getEndpointPageFromInput, getWorkspaceFromEndpointInput} from '../../utils';
import {permissionGroupListExtractor} from '../utils';
import {GetWorkspacePermissionGroupsEndpoint} from './types';
import {getWorkspacePermissionGroupsQuery} from './utils';
import {getWorkspacePermissionGroupsJoiSchema} from './validation';

const getWorkspacePermissionGroups: GetWorkspacePermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getWorkspacePermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  const q = await getWorkspacePermissionGroupsQuery(context, agent, workspace);
  let items = await context.data.permissiongroup.getManyByQuery(q, data);
  items = await populateResourceListWithAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    items,
    AppResourceType.PermissionGroup
  );
  return {
    page: getEndpointPageFromInput(data),
    permissionGroups: permissionGroupListExtractor(items),
  };
};

export default getWorkspacePermissionGroups;

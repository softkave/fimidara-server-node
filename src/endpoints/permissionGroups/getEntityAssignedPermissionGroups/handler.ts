import {validate} from '../../../utils/validate';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {
  assignedPermissionGroupsListExtractor,
  permissionGroupWithAssignedMetaListExtractor,
} from '../utils';
import {GetEntityAssignedPermissionGroupsEndpoint} from './types';
import {
  checkReadEntityAssignedPermissionGroups,
  fetchEntityAssignedPermissionGroupList,
} from './utils';
import {getEntityAssignedPermissionGroupsJoiSchema} from './validation';

const getEntityAssignedPermissionGroups: GetEntityAssignedPermissionGroupsEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, getEntityAssignedPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkReadEntityAssignedPermissionGroups(context, agent, workspace, data.entityId);
  const {permissionGroupsWithAssignedItems, immediatelyAssignedPermissionGroupsMeta} =
    await fetchEntityAssignedPermissionGroupList(
      context,
      workspace.resourceId,
      data.entityId,
      data.includeInheritedPermissionGroups
    );
  return {
    permissionGroups: permissionGroupWithAssignedMetaListExtractor(
      permissionGroupsWithAssignedItems
    ),
    immediateAssignedPermissionGroupsMeta: assignedPermissionGroupsListExtractor(
      immediatelyAssignedPermissionGroupsMeta
    ),
  };
};

export default getEntityAssignedPermissionGroups;

import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionContainerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import checkEntitiesExist from '../../permissionItems/checkEntitiesExist';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {AssignPermissionGroupsEndpoint} from './types';
import {assignPermissionGroupsJoiSchema} from './validation';

// TODO: prevent assigning same permission group twice
const assignPermissionGroups: AssignPermissionGroupsEndpoint = async (context, instData) => {
  const data = validate(instData.data, assignPermissionGroupsJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action: BasicCRUDActions.GrantPermission,
    type: AppResourceType.PermissionGroup,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
  });

  const entityIdList = data.entityIdList ? data.entityIdList : data.entityId ? [data.entityId] : [];
  await checkEntitiesExist(context, agent, workspace, entityIdList);
  await addAssignedPermissionGroupList(
    context,
    agent,
    workspace,
    data.permissionGroups,
    entityIdList,
    false, // don't delete existing
    false // don't skip permission group check
  );
  return {};
};

export default assignPermissionGroups;

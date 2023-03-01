import {BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';

export async function checkReadEntityAssignedPermissionGroups(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace,
  entityId: string
) {
  if (isFetchingOwnPermissionGroups(agent, entityId)) {
    return true;
  } else {
    await checkAuthorization({
      context,
      agent,
      workspaceId: workspace.resourceId,
      action: BasicCRUDActions.Read,
      targets: [{targetId: entityId}],
    });
    return true;
  }
}

export function isFetchingOwnPermissionGroups(agent: ISessionAgent, entityId: string) {
  return agent.agentId === entityId;
}

export async function fetchEntityAssignedPermissionGroupList(
  context: IBaseContext,
  entityId: string,
  includeInheritedPermissionGroups = true
) {
  return await context.semantic.permissions.getEntityAssignedPermissionGroups({
    context,
    entityId,
    fetchDeep: includeInheritedPermissionGroups,
  });
}

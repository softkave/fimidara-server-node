import {AppActionType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';

export async function checkReadEntityAssignedPermissionGroups(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  entityId: string
) {
  if (isFetchingOwnPermissionGroups(agent, entityId)) {
    return true;
  } else {
    await checkAuthorization({
      context,
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      action: AppActionType.Read,
      targets: {targetId: entityId},
    });
    return true;
  }
}

export function isFetchingOwnPermissionGroups(agent: SessionAgent, entityId: string) {
  return agent.agentId === entityId;
}

export async function fetchEntityAssignedPermissionGroupList(
  context: BaseContextType,
  entityId: string,
  includeInheritedPermissionGroups = true,
  opts?: SemanticDataAccessProviderRunOptions
) {
  return await context.semantic.permissions.getEntityAssignedPermissionGroups(
    {
      context,
      entityId,
      fetchDeep: includeInheritedPermissionGroups,
    },
    opts
  );
}

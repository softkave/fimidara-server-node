import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {SemanticDataAccessProviderRunOptions} from '../../contexts/semantic/types';
import {BaseContextType} from '../../contexts/types';

export async function checkReadEntityAssignedPermissionGroups(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace,
  entityId: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  if (isFetchingOwnPermissionGroups(agent, entityId)) {
    return true;
  } else {
    await checkAuthorizationWithAgent({
      context,
      agent,
      workspace,
      opts,
      workspaceId: workspace.resourceId,
      target: {targetId: entityId, action: 'updatePermission'},
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

import {AppActionType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {ISemanticDataAccessProviderRunOptions} from '../../contexts/semantic/types';
import {BaseContext} from '../../contexts/types';

export async function checkReadEntityAssignedPermissionGroups(
  context: BaseContext,
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
  context: BaseContext,
  entityId: string,
  includeInheritedPermissionGroups = true,
  opts?: ISemanticDataAccessProviderRunOptions
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

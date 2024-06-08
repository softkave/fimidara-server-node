import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';

export async function checkReadEntityAssignedPermissionGroups(
  agent: SessionAgent,
  workspace: Workspace,
  entityId: string,
  opts?: SemanticProviderOpParams
) {
  if (isFetchingOwnPermissionGroups(agent, entityId)) {
    return true;
  } else {
    await checkAuthorizationWithAgent({
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
  entityId: string,
  includeInheritedPermissionGroups = true,
  opts?: SemanticProviderOpParams
) {
  return await kSemanticModels.permissions().getEntityAssignedPermissionGroups(
    {
      entityId,
      fetchDeep: includeInheritedPermissionGroups,
    },
    opts
  );
}

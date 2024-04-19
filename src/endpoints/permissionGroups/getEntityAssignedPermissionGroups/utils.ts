import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../../contexts/semantic/types';

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

import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../../contexts/semantic/types.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';

export async function checkReadAssignedPermissionGroups(
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
      opts,
      workspaceId: workspace.resourceId,
      target: {
        targetId: entityId,
        action: kFimidaraPermissionActions.readPermission,
      },
    });

    return true;
  }
}

export function isFetchingOwnPermissionGroups(
  agent: SessionAgent,
  entityId: string
) {
  return agent.agentId === entityId;
}

export async function fetchAssignedPermissionGroupList(
  entityId: string,
  includeInheritedPermissionGroups = true,
  opts?: SemanticProviderOpParams
) {
  return await kSemanticModels
    .permissions()
    .getAssignedPermissionGroups(
      {entityId, fetchDeep: includeInheritedPermissionGroups},
      opts
    );
}

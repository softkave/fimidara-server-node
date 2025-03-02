import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../../contexts/semantic/types.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';

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

export function isFetchingOwnPermissionGroups(
  agent: SessionAgent,
  entityId: string
) {
  return agent.agentId === entityId;
}

export async function fetchEntityAssignedPermissionGroupList(params: {
  workspaceId: string;
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
  opts?: SemanticProviderOpParams;
}) {
  const {
    workspaceId,
    entityId,
    includeInheritedPermissionGroups = true,
    opts,
  } = params;

  return await kIjxSemantic.permissions().getEntityAssignedPermissionGroups(
    {
      workspaceId,
      entityId,
      fetchDeep: includeInheritedPermissionGroups,
    },
    opts
  );
}

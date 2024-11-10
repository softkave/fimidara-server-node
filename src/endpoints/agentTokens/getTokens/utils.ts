import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getAgentTokensQuery(
  agent: SessionAgent,
  workspaceId: string
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId,
    target: {
      action: kFimidaraPermissionActions.readAgentToken,
      targetId: workspaceId,
    },
  });

  return getWorkspaceResourceByIdList(workspaceId, report);
}

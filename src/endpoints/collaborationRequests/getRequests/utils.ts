import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getCollaborationRequestsQuery(
  agent: SessionAgent,
  workspaceId: string
) {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspaceId,
      target: {
        targetId: workspaceId,
        action: kFimidaraPermissionActions.readCollaborationRequest,
      },
    });

  return getWorkspaceResourceByIdList(workspaceId, permissionsSummaryReport);
}

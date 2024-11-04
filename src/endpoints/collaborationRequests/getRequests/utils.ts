import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getCollaborationRequestsQuery(
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspaceId: workspace.resourceId,
      workspace: workspace,
      target: {
        targetId: workspace.resourceId,
        action: 'readCollaborationRequest',
      },
    });
  return getWorkspaceResourceByIdList(workspace, permissionsSummaryReport);
}

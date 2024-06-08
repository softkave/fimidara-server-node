import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {getWorkspaceResourceListQuery00} from '../../utils.js';

export async function getWorkspaceCollaborationRequestsQuery(
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {targetId: workspace.resourceId, action: 'readCollaborationRequest'},
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceCollaborationRequestsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {targetId: workspace.resourceId, action: 'readCollaborationRequest'},
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

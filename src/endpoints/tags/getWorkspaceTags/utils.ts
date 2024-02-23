import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceTagsQuery(agent: SessionAgent, workspace: Workspace) {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'readTag'},
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

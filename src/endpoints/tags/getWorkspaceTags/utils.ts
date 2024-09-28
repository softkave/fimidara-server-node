import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceResourceListQuery00} from '../../utils.js';

export async function getWorkspaceTagsQuery(
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {targetId: workspace.resourceId, action: 'readTag'},
    });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

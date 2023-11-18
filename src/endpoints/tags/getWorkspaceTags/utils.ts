import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceTagsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'readTag'},
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

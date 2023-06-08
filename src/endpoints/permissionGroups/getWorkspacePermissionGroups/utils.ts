import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspacePermissionGroupsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    targets: {targetType: AppResourceType.PermissionGroup},
    action: AppActionType.Read,
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

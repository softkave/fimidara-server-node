import {AppActionType, AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspacePermissionGroupsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: {targetType: AppResourceType.PermissionGroup},
    action: AppActionType.Read,
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

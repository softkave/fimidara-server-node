import {AppActionType, AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceCollaborationRequestsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    targets: {targetType: AppResourceType.CollaborationRequest},
    action: AppActionType.Read,
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

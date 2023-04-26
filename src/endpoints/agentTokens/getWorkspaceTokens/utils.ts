import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceAgentTokensQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    targets: {targetType: AppResourceType.AgentToken},
    action: AppActionType.Read,
  });
  return getWorkspaceResourceListQuery00(workspace, permissionsSummaryReport);
}

import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceAgentTokensQuery(
  agent: SessionAgent,
  workspace: Workspace
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readAgentToken', targetId: workspace.resourceId},
  });
  return getWorkspaceResourceListQuery00(workspace, report);
}

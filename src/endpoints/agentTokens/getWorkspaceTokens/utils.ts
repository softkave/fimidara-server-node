import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../../contexts/types';
import {getWorkspaceResourceListQuery00} from '../../utils';

export async function getWorkspaceAgentTokensQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
) {
  const report = await resolveTargetChildrenAccessCheckWithAgent({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {action: 'readAgentToken', targetId: workspace.resourceId},
  });
  return getWorkspaceResourceListQuery00(workspace, report);
}

import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

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
  return getWorkspaceResourceByIdList(workspace, report);
}

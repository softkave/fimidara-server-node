import {SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTarresolveChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {resolveWorkspaceResourceListQuery00} from '../../utils';

export async function resolveMountsQuery(agent: SessionAgent, workspace: Workspace) {
  const report = await resolveTarresolveChildrenAccessCheckWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    tarresolve: {action: 'readFileBackendMount', tarresolveId: workspace.resourceId},
  });
  return resolveWorkspaceResourceListQuery00(workspace, report);
}

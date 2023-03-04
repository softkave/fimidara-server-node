import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {getWorkspaceResourceListQuery} from '../../utils';

export async function getWorkspaceTagsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: {type: AppResourceType.AgentToken},
    action: BasicCRUDActions.Read,
  });
  return getWorkspaceResourceListQuery(workspace, permissionsSummaryReport);
}

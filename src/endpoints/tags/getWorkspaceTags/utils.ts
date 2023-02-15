import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
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
    workspace,
    type: AppResourceType.ProgramAccessToken,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });
  return getWorkspaceResourceListQuery(workspace, permissionsSummaryReport);
}

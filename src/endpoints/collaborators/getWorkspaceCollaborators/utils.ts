import {AppResourceType, BasicCRUDActions, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import AssignedItemQueries from '../../assignedItems/queries';
import {
  makeWorkspacePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/types';
import {PermissionDeniedError} from '../../user/errors';

export async function getWorkspaceCollaboratorsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
) {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspace,
    type: AppResourceType.User,
    permissionContainers: makeWorkspacePermissionContainerList(workspace.resourceId),
    action: BasicCRUDActions.Read,
  });

  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return AssignedItemQueries.getWorkspaceCollaborators(
      workspace.resourceId,
      undefined,
      permissionsSummaryReport.deniedResourceIdList
    );
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return AssignedItemQueries.getWorkspaceCollaborators(
      workspace.resourceId,
      permissionsSummaryReport.allowedResourceIdList
    );
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}

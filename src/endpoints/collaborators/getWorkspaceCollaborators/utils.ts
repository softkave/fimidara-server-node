import {IAssignedItem} from '../../../definitions/assignedItem';
import {AppActionType, AppResourceType, ISessionAgent} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {LiteralDataQuery} from '../../contexts/data/types';
import {IBaseContext} from '../../contexts/types';
import {PermissionDeniedError} from '../../user/errors';

export async function getWorkspaceCollaboratorsQuery(
  context: IBaseContext,
  agent: ISessionAgent,
  workspace: IWorkspace
): Promise<LiteralDataQuery<IAssignedItem>> {
  const permissionsSummaryReport = await summarizeAgentPermissionItems({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    targets: {targetType: AppResourceType.User},
    action: AppActionType.Read,
  });

  if (permissionsSummaryReport.hasFullOrLimitedAccess) {
    return {
      workspaceId: workspace.resourceId,
      assigneeId: permissionsSummaryReport.deniedResourceIdList && {
        $nin: permissionsSummaryReport.deniedResourceIdList,
      },
      assignedItemType: AppResourceType.Workspace,
      assigneeType: AppResourceType.User,
    };
  } else if (permissionsSummaryReport.allowedResourceIdList) {
    return {
      workspaceId: workspace.resourceId,
      assigneeId: permissionsSummaryReport.allowedResourceIdList && {
        $in: permissionsSummaryReport.allowedResourceIdList,
      },
      assignedItemType: AppResourceType.Workspace,
      assigneeType: AppResourceType.User,
    };
  } else if (permissionsSummaryReport.noAccess) {
    throw new PermissionDeniedError();
  }

  appAssert(false, new ServerError(), 'Control flow should not get here.');
}

import {AssignedItem} from '../../../definitions/assignedItem';
import {AppActionType, AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {appAssert} from '../../../utils/assertion';
import {ServerError} from '../../../utils/errors';
import {summarizeAgentPermissionItems} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {DataQuery} from '../../contexts/data/types';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {PermissionDeniedError} from '../../users/errors';

export async function getWorkspaceCollaboratorsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
): Promise<DataQuery<AssignedItem>> {
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
      assignedItemType: AppResourceType.Workspace,
      assigneeType: AppResourceType.User,
      ...getInAndNinQuery<AssignedItem>(
        'assigneeId',
        /** inList */ undefined,
        permissionsSummaryReport.deniedResourceIdList
      ),
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

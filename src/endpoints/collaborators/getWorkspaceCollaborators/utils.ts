import {AssignedItem} from '../../../definitions/assignedItem';
import {AppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {DataQuery} from '../../contexts/data/types';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import {PermissionDeniedError} from '../../users/errors';

export async function getWorkspaceCollaboratorsQuery(
  context: BaseContextType,
  agent: SessionAgent,
  workspace: Workspace
): Promise<DataQuery<AssignedItem>> {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    context,
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {targetId: workspace.resourceId, action: 'readCollaborator'},
  });

  if (permissionsSummaryReport.access === 'full') {
    return {
      workspaceId: workspace.resourceId,
      assignedItemType: AppResourceType.Workspace,
      assigneeType: AppResourceType.User,
      ...getInAndNinQuery<AssignedItem>(
        'assigneeId',
        /** inList */ undefined,
        permissionsSummaryReport.partialDenyIds
      ),
    };
  } else if (permissionsSummaryReport.access === 'partial') {
    return {
      workspaceId: workspace.resourceId,
      assigneeId: permissionsSummaryReport.partialAllowIds && {
        $in: permissionsSummaryReport.partialAllowIds,
      },
      assignedItemType: AppResourceType.Workspace,
      assigneeType: AppResourceType.User,
    };
  }

  throw new PermissionDeniedError();
}

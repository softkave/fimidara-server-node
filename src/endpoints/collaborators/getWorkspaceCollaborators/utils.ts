import {AssignedItem} from '../../../definitions/assignedItem';
import {kFimidaraResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {
  kResolvedTargetChildrenAccess,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {DataQuery} from '../../contexts/data/types';
import {getInAndNinQuery} from '../../contexts/semantic/utils';
import {PermissionDeniedError} from '../../users/errors';

export async function getWorkspaceCollaboratorsQuery(
  agent: SessionAgent,
  workspace: Workspace
): Promise<DataQuery<AssignedItem>> {
  const permissionsSummaryReport = await resolveTargetChildrenAccessCheckWithAgent({
    agent,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {targetId: workspace.resourceId, action: 'readCollaborator'},
  });

  if (permissionsSummaryReport.access === kResolvedTargetChildrenAccess.full) {
    return {
      workspaceId: workspace.resourceId,
      assignedItemType: kFimidaraResourceType.Workspace,
      assigneeType: kFimidaraResourceType.User,
      ...getInAndNinQuery<AssignedItem>(
        'assigneeId',
        /** inList */ undefined,
        permissionsSummaryReport.partialDenyIds
      ),
    };
  } else if (permissionsSummaryReport.access === kResolvedTargetChildrenAccess.partial) {
    return {
      workspaceId: workspace.resourceId,
      assigneeId: permissionsSummaryReport.partialAllowIds && {
        $in: permissionsSummaryReport.partialAllowIds,
      },
      assignedItemType: kFimidaraResourceType.Workspace,
      assigneeType: kFimidaraResourceType.User,
    };
  }

  throw new PermissionDeniedError();
}

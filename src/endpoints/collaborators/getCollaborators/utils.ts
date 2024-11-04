import {
  kResolvedTargetChildrenAccess,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {DataQuery} from '../../../contexts/data/types.js';
import {getInAndNinQuery} from '../../../contexts/semantic/utils.js';
import {AssignedItem} from '../../../definitions/assignedItem.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {PermissionDeniedError} from '../../users/errors.js';

export async function getCollaboratorsQuery(
  agent: SessionAgent,
  workspaceId: string
): Promise<DataQuery<AssignedItem>> {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspaceId,
      target: {targetId: workspaceId, action: 'readCollaborator'},
    });

  if (permissionsSummaryReport.access === kResolvedTargetChildrenAccess.full) {
    return {
      workspaceId,
      assignedItemType: kFimidaraResourceType.Workspace,
      assigneeType: kFimidaraResourceType.User,
      ...getInAndNinQuery<AssignedItem>(
        'assigneeId',
        /** inList */ undefined,
        permissionsSummaryReport.partialDenyIds
      ),
    };
  } else if (
    permissionsSummaryReport.access === kResolvedTargetChildrenAccess.partial
  ) {
    return {
      workspaceId,
      assigneeId: permissionsSummaryReport.partialAllowIds && {
        $in: permissionsSummaryReport.partialAllowIds,
      },
      assignedItemType: kFimidaraResourceType.Workspace,
      assigneeType: kFimidaraResourceType.User,
    };
  }

  throw new PermissionDeniedError();
}

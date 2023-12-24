import {AssignedItem} from '../../../definitions/assignedItem';
import {kAppResourceType, SessionAgent} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {resolveTargetChildrenAccessCheckWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
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

  if (permissionsSummaryReport.access === 'full') {
    return {
      workspaceId: workspace.resourceId,
      assignedItemType: kAppResourceType.Workspace,
      assigneeType: kAppResourceType.User,
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
      assignedItemType: kAppResourceType.Workspace,
      assigneeType: kAppResourceType.User,
    };
  }

  throw new PermissionDeniedError();
}

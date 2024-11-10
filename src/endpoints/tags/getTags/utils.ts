import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {SessionAgent} from '../../../definitions/system.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getTagsQuery(agent: SessionAgent, workspaceId: string) {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspaceId,
      target: {
        targetId: workspaceId,
        action: kFimidaraPermissionActions.readTag,
      },
    });

  return getWorkspaceResourceByIdList(workspaceId, permissionsSummaryReport);
}

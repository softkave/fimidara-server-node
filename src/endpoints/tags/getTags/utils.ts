import {resolveTargetChildrenAccessCheckWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {SessionAgent} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getWorkspaceResourceByIdList} from '../../utils.js';

export async function getTagsQuery(agent: SessionAgent, workspace: Workspace) {
  const permissionsSummaryReport =
    await resolveTargetChildrenAccessCheckWithAgent({
      agent,
      workspace,
      workspaceId: workspace.resourceId,
      target: {targetId: workspace.resourceId, action: 'readTag'},
    });
  return getWorkspaceResourceByIdList(workspace, permissionsSummaryReport);
}

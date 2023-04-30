import {SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {BaseContextType} from '../contexts/types';
import {PermissionDeniedError} from '../users/errors';

export async function assertUserIsPartOfRootWorkspace(
  context: BaseContextType,
  agent: SessionAgent
) {
  appAssert(agent.user);
  const workspaceAssignedItem = await context.semantic.assignedItem.getOneByQuery({
    assignedItemId: context.appVariables.appWorkspaceId,
    assigneeId: agent.user.resourceId,
  });
  appAssert(workspaceAssignedItem, new PermissionDeniedError());
}

import {SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables.js';
import {PermissionDeniedError} from '../users/errors.js';

export async function assertUserIsPartOfRootWorkspace(agent: SessionAgent) {
  appAssert(agent.user, new PermissionDeniedError());
  const workspaceAssignedItem = await kSemanticModels.assignedItem().getOneByQuery({
    assignedItemId: kUtilsInjectables.runtimeConfig().appWorkspaceId,
    assigneeId: agent.user.resourceId,
  });
  appAssert(workspaceAssignedItem, new PermissionDeniedError());
}

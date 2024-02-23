import {SessionAgent} from '../../definitions/system';
import {appAssert} from '../../utils/assertion';
import {kSemanticModels, kUtilsInjectables} from '../contexts/injection/injectables';
import {PermissionDeniedError} from '../users/errors';

export async function assertUserIsPartOfRootWorkspace(agent: SessionAgent) {
  appAssert(agent.user);
  const workspaceAssignedItem = await kSemanticModels.assignedItem().getOneByQuery({
    assignedItemId: kUtilsInjectables.runtimeConfig().appWorkspaceId,
    assigneeId: agent.user.resourceId,
  });
  appAssert(workspaceAssignedItem, new PermissionDeniedError());
}

import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {SessionAgent} from '../../definitions/system.js';
import {appAssert} from '../../utils/assertion.js';
import {PermissionDeniedError} from '../users/errors.js';

export async function assertUserIsPartOfRootWorkspace(agent: SessionAgent) {
  appAssert(agent.user, new PermissionDeniedError());
  const workspaceAssignedItem = await kIjxSemantic
    .assignedItem()
    .getOneByQuery({
      assignedItemId: kIjxUtils.runtimeConfig().appWorkspaceId,
      assigneeId: agent.user.resourceId,
    });
  appAssert(workspaceAssignedItem, new PermissionDeniedError());
}

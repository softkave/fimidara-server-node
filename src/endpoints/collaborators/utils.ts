import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {PublicCollaborator, UserWithWorkspace} from '../../definitions/user.js';
import {NotFoundError} from '../errors.js';
import {assertUser} from '../users/utils.js';

export const collaboratorExtractor = (item: UserWithWorkspace) => {
  const collaborator: PublicCollaborator = {
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    ...userWorkspace,
    resourceId: item.resourceId,
  };
  return collaborator;
};

export const collaboratorListExtractor = (items: UserWithWorkspace[]) => {
  return items.map(item => collaboratorExtractor(item));
};

export async function checkCollaboratorAuthorization(
  agent: SessionAgent,
  workspaceId: string,
  collaborator: UserWithWorkspace,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  await checkAuthorizationWithAgent({
    agent,
    opts,
    workspaceId,
    target: {action, targetId: collaborator.resourceId},
  });

  return {agent, collaborator};
}

export async function checkCollaboratorAuthorization02(
  agent: SessionAgent,
  workspaceId: string,
  collaboratorId: string,
  action: FimidaraPermissionAction
) {
  const user = await kSemanticModels.user().getOneById(collaboratorId);
  assertUser(user);

  return checkCollaboratorAuthorization(agent, workspaceId, user, action);
}

export function throwCollaboratorNotFound() {
  throw new NotFoundError('Collaborator not found');
}

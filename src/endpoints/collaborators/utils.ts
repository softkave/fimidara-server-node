import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic} from '../../contexts/ijx/injectables.js';
import {SemanticProviderOpParams} from '../../contexts/semantic/types.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {SessionAgent} from '../../definitions/system.js';
import {PublicCollaborator, UserWithWorkspace} from '../../definitions/user.js';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems.js';
import {NotFoundError} from '../errors.js';
import {assertUser} from '../users/utils.js';
import {checkWorkspaceExists} from '../workspaces/utils.js';

export const collaboratorExtractor = (
  item: UserWithWorkspace,
  workspaceId: string
) => {
  const userWorkspace = getCollaboratorWorkspace(item, workspaceId);

  if (!userWorkspace) {
    throw new NotFoundError('Collaborator not found');
  }

  const collaborator: PublicCollaborator = {
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    ...userWorkspace,
    resourceId: item.resourceId,
  };
  return collaborator;
};

export const collaboratorListExtractor = (
  items: UserWithWorkspace[],
  workspaceId: string
) => {
  return items.map(item => collaboratorExtractor(item, workspaceId));
};

export async function checkCollaboratorAuthorization(
  agent: SessionAgent,
  workspaceId: string,
  collaborator: UserWithWorkspace,
  action: FimidaraPermissionAction,
  opts?: SemanticProviderOpParams
) {
  const userWorkspace = getCollaboratorWorkspace(collaborator, workspaceId);
  if (!userWorkspace) {
    throwCollaboratorNotFound();
  }

  const workspace = await checkWorkspaceExists(workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    opts,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    target: {action, targetId: collaborator.resourceId},
  });
  return {agent, collaborator, workspace};
}

export async function checkCollaboratorAuthorization02(
  agent: SessionAgent,
  workspaceId: string,
  collaboratorId: string,
  action: FimidaraPermissionAction
) {
  const user = await kIjxSemantic.user().getOneById(collaboratorId);
  assertUser(user);
  const collaborator = await populateUserWorkspaces(user);
  return checkCollaboratorAuthorization(
    agent,
    workspaceId,
    collaborator,
    action
  );
}

export function throwCollaboratorNotFound() {
  throw new NotFoundError('Collaborator not found');
}

export function getCollaboratorWorkspace(
  user: UserWithWorkspace,
  workspaceId: string
) {
  return user.workspaces.find(item => item.workspaceId === workspaceId);
}

export function removeOtherUserWorkspaces(
  collaborator: UserWithWorkspace,
  workspaceId: string
): UserWithWorkspace {
  return {
    ...collaborator,
    workspaces: collaborator.workspaces.filter(
      item => item.workspaceId === workspaceId
    ),
  };
}

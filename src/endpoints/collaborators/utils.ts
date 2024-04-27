import {FimidaraPermissionAction} from '../../definitions/permissionItem';
import {SessionAgent} from '../../definitions/system';
import {PublicCollaborator, UserWithWorkspace} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {checkAuthorizationWithAgent} from '../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../contexts/injection/injectables';
import {SemanticProviderOpParams} from '../contexts/semantic/types';
import {NotFoundError} from '../errors';
import {assertUser} from '../users/utils';
import {checkWorkspaceExists} from '../workspaces/utils';

export const collaboratorExtractor = (item: UserWithWorkspace, workspaceId: string) => {
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
  const user = await kSemanticModels.user().getOneById(collaboratorId);
  assertUser(user);
  const collaborator = await populateUserWorkspaces(user);
  return checkCollaboratorAuthorization(agent, workspaceId, collaborator, action);
}

export function throwCollaboratorNotFound() {
  throw new NotFoundError('Collaborator not found');
}

export function getCollaboratorWorkspace(user: UserWithWorkspace, workspaceId: string) {
  return user.workspaces.find(item => item.workspaceId === workspaceId);
}

export function removeOtherUserWorkspaces(
  collaborator: UserWithWorkspace,
  workspaceId: string
): UserWithWorkspace {
  return {
    ...collaborator,
    workspaces: collaborator.workspaces.filter(item => item.workspaceId === workspaceId),
  };
}

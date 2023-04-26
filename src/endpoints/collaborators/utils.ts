import {AppActionType, SessionAgent} from '../../definitions/system';
import {PublicCollaborator, UserWithWorkspace} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {checkAuthorization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {BaseContextType} from '../contexts/types';
import {NotFoundError} from '../errors';
import {assertUser} from '../users/utils';
import {checkWorkspaceExists} from '../workspaces/utils';

export const collaboratorExtractor = (item: UserWithWorkspace, workspaceId: string) => {
  const userWorkspace = getCollaboratorWorkspace(item, workspaceId);
  if (!userWorkspace) {
    throw new NotFoundError('Collaborator not found');
  }

  const collaborator: PublicCollaborator = {
    resourceId: item.resourceId,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    joinedAt: userWorkspace.joinedAt,
    workspaceId: userWorkspace.workspaceId,
  };
  return collaborator;
};

export const collaboratorListExtractor = (items: UserWithWorkspace[], workspaceId: string) => {
  return items.map(item => collaboratorExtractor(item, workspaceId));
};

export async function checkCollaboratorAuthorization(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  collaborator: UserWithWorkspace,
  action: AppActionType
) {
  const userWorkspace = getCollaboratorWorkspace(collaborator, workspaceId);
  if (!userWorkspace) {
    throwCollaboratorNotFound();
  }

  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    action,
    workspaceId: workspace.resourceId,
    workspace: workspace,
    targets: {targetId: collaborator.resourceId},
  });
  return {agent, collaborator, workspace};
}

export async function checkCollaboratorAuthorization02(
  context: BaseContextType,
  agent: SessionAgent,
  workspaceId: string,
  collaboratorId: string,
  action: AppActionType
) {
  const user = await context.semantic.user.getOneById(collaboratorId);
  assertUser(user);
  const collaborator = await populateUserWorkspaces(context, user);
  return checkCollaboratorAuthorization(context, agent, workspaceId, collaborator, action);
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

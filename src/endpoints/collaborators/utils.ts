import {
  AppResourceType,
  BasicCRUDActions,
  ISessionAgent,
} from '../../definitions/system';
import {IPublicCollaborator, IUserWithWorkspace} from '../../definitions/user';
import {populateUserWorkspaces} from '../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeWorkspacePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/types';
import {NotFoundError} from '../errors';
import EndpointReusableQueries from '../queries';
import {checkWorkspaceExists} from '../workspaces/utils';

export const collaboratorExtractor = (
  item: IUserWithWorkspace,
  workspaceId: string
) => {
  const userWorkspace = getCollaboratorWorkspace(item, workspaceId);

  if (!userWorkspace) {
    throw new NotFoundError('Collaborator not found');
  }

  const collaborator: IPublicCollaborator = {
    resourceId: item.resourceId,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    joinedAt: userWorkspace.joinedAt,
    workspaceId: userWorkspace.workspaceId,
    permissionGroups: userWorkspace.permissionGroups,
  };

  return collaborator;
};

export const collaboratorListExtractor = (
  items: IUserWithWorkspace[],
  workspaceId: string
) => {
  return items.map(item => collaboratorExtractor(item, workspaceId));
};

export async function checkCollaboratorAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  collaborator: IUserWithWorkspace,
  action: BasicCRUDActions,
  nothrow = false
) {
  const userWorkspace = getCollaboratorWorkspace(collaborator, workspaceId);

  if (!userWorkspace) {
    throwCollaboratorNotFound();
  }

  const workspace = await checkWorkspaceExists(context, workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspace,
    action,
    nothrow,
    resource: collaborator,
    type: AppResourceType.User,
    permissionOwners: makeWorkspacePermissionOwnerList(workspaceId),
  });

  return {agent, collaborator, workspace};
}

export async function checkCollaboratorAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  workspaceId: string,
  collaboratorId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const collaborator = await populateUserWorkspaces(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(collaboratorId)
    )
  );

  return checkCollaboratorAuthorization(
    context,
    agent,
    workspaceId,
    collaborator,
    action,
    nothrow
  );
}

export function throwCollaboratorNotFound() {
  throw new NotFoundError('Collaborator not found');
}

export function getCollaboratorWorkspace(
  user: IUserWithWorkspace,
  workspaceId: string
) {
  return user.workspaces.find(item => item.workspaceId === workspaceId);
}

export function removeOtherUserWorkspaces(
  collaborator: IUserWithWorkspace,
  workspaceId: string
): IUserWithWorkspace {
  return {
    ...collaborator,
    workspaces: collaborator.workspaces.filter(
      item => item.workspaceId === workspaceId
    ),
  };
}

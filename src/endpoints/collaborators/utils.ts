import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {
  IPublicCollaborator,
  IUser,
  IUserOrganization,
} from '../../definitions/user';
import {getDateString} from '../../utilities/dateFns';
import {getFields} from '../../utilities/extract';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {assignedPresetsListExtractor} from '../presetPermissionsGroups/utils';
import CollaboratorQueries from './queries';

const collaboratorFields = getFields<IPublicCollaborator>({
  resourceId: true,
  firstName: true,
  lastName: true,
  email: true,
  joinedAt: getDateString,
  organizationId: true,
  presets: assignedPresetsListExtractor,
});

export const collaboratorExtractor = (item: IUser, organizationId: string) => {
  const userOrg = getCollaboratorOrganization(item, organizationId);

  if (!userOrg) {
    throw new NotFoundError('Collaborator not found');
  }

  const collaborator: IPublicCollaborator = {
    resourceId: item.resourceId,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    joinedAt: userOrg.joinedAt,
    organizationId: userOrg.organizationId,
    presets: userOrg.presets,
  };

  return collaborator;
};

export const collaboratorListExtractor = (
  items: IUser[],
  organizationId: string
) => {
  return items.map(item => collaboratorExtractor(item, organizationId));
};

export async function checkCollaboratorAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  collaborator: IUser,
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorization({
    context,
    agent,
    organization,
    action,
    nothrow,
    resource: collaborator,
    type: AppResourceType.User,
    permissionOwners: makeOrgPermissionOwnerList(organizationId),
  });

  return {agent, collaborator, organization};
}

export async function checkCollaboratorAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  collaboratorId: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const collaborator = await context.data.user.assertGetItem(
    CollaboratorQueries.getByOrganizationIdAndUserId(
      organizationId,
      collaboratorId
    )
  );

  return checkCollaboratorAuthorization(
    context,
    agent,
    organizationId,
    collaborator,
    action,
    nothrow
  );
}

export function throwCollaboratorNotFound() {
  throw new NotFoundError('Collaborator not found');
}

export function getCollaboratorOrganization(
  user: IUser,
  organizationId: string
) {
  return user.organizations.find(
    item => item.organizationId === organizationId
  );
}

export function getCollaboratorOrganizationIndex(
  user: IUser,
  organizationId: string
) {
  return user.organizations.findIndex(
    item => item.organizationId === organizationId
  );
}

export function updateCollaboratorOrganization(
  user: IUser,
  organizationId: string,
  fn: (data?: IUserOrganization) => IUserOrganization | undefined
) {
  const index = getCollaboratorOrganizationIndex(user, organizationId);
  const data = index === -1 ? undefined : user.organizations[index];
  const update = fn(data);

  if (update) {
    index === -1
      ? user.organizations.push(update)
      : (user.organizations[index] = update);
    return true;
  }

  return false;
}

export function removeOtherUserOrgs(collaborator: IUser, orgId: string): IUser {
  return {
    ...collaborator,
    organizations: collaborator.organizations.filter(
      item => item.organizationId === orgId
    ),
  };
}

import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {
  IPublicCollaborator,
  IUserWithOrganization,
} from '../../definitions/user';
import {withUserOrganizations} from '../assignedItems/getAssignedItems';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import EndpointReusableQueries from '../queries';

export const collaboratorExtractor = (
  item: IUserWithOrganization,
  organizationId: string
) => {
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
  items: IUserWithOrganization[],
  organizationId: string
) => {
  return items.map(item => collaboratorExtractor(item, organizationId));
};

export async function checkCollaboratorAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  collaborator: IUserWithOrganization,
  action: BasicCRUDActions,
  nothrow = false
) {
  const userOrg = getCollaboratorOrganization(collaborator, organizationId);

  if (!userOrg) {
    throwCollaboratorNotFound();
  }

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
  const collaborator = await withUserOrganizations(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(collaboratorId)
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
  user: IUserWithOrganization,
  organizationId: string
) {
  return user.organizations.find(
    item => item.organizationId === organizationId
  );
}

export function removeOtherUserOrgs(
  collaborator: IUserWithOrganization,
  orgId: string
): IUserWithOrganization {
  return {
    ...collaborator,
    organizations: collaborator.organizations.filter(
      item => item.organizationId === orgId
    ),
  };
}

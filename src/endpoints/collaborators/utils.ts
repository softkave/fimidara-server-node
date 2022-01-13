import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {IUser, IUserOrganization} from '../../definitions/user';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {
  checkAuthorization,
  makeBasePermissionOwnerList,
} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {checkOrganizationExists} from '../organizations/utils';
import {userOrgListExtractor} from '../user/utils';
import CollaboratorQueries from './queries';
import {IPublicCollaborator} from './types';

const collaboratorFields = getFields<IPublicCollaborator>({
  resourceId: true,
  firstName: true,
  lastName: true,
  email: true,
  organizations: userOrgListExtractor,
});

export const collaboratorBaseExtractor = makeExtract(collaboratorFields);
export const collaboratorListBaseExtractor = makeListExtract(
  collaboratorFields
);

export const collaboratorExtractor = (item: IUser, organizationId: string) => {
  const p = collaboratorBaseExtractor(item);
  p.organizations = p.organizations.filter(
    io1 => io1.organizationId === organizationId
  );
  return p;
};

export const collaboratorListExtractor = (
  items: IUser[],
  organizationId: string
) => {
  const ps = collaboratorListBaseExtractor(items);
  ps.forEach(p => {
    p.organizations = p.organizations.filter(
      io1 => io1.organizationId === organizationId
    );
  });
  return ps;
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
  await checkAuthorization(
    context,
    agent,
    organizationId,
    collaborator.resourceId,
    AppResourceType.User,
    makeBasePermissionOwnerList(organizationId),
    action,
    nothrow
  );

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

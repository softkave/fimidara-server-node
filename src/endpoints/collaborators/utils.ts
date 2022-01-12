import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {IUser} from '../../definitions/user';
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

export const collaboratorExtractor = makeExtract(collaboratorFields);
export const collaboratorListExtractor = makeListExtract(collaboratorFields);
export function getCollaboratorOrganization(
  user: IUser,
  organizationId: string
) {
  return user.organizations.find(
    item => item.organizationId === organizationId
  );
}

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
    AppResourceType.Collaborator,
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

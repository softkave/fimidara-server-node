import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {IUser} from '../../definitions/user';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForCollaborator} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {checkOrganizationExists} from '../organizations/utils';
import CollaboratorQueries from './queries';
import {IPublicCollaborator} from './types';

const collaboratorFields = getFields<IPublicCollaborator>({});

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
  action: BasicCRUDActions
) {
  const organization = await checkOrganizationExists(context, organizationId);
  await checkAuthorizationForCollaborator(
    context,
    agent,
    organization.organizationId,
    collaborator,
    action
  );

  return {agent, collaborator, organization};
}

export async function checkCollaboratorAuthorizationWithCollaboratorId(
  context: IBaseContext,
  agent: ISessionAgent,
  organizationId: string,
  id: string,
  action: BasicCRUDActions
) {
  const collaborator = await context.data.user.assertGetItem(
    CollaboratorQueries.getById(id)
  );

  return checkCollaboratorAuthorization(
    context,
    agent,
    organizationId,
    collaborator,
    action
  );
}

import {IOrganization} from '../../definitions/organization';
import {ISessionAgent, BasicCRUDActions} from '../../definitions/system';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorizationForOrganization} from '../contexts/authorizationChecks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {agentExtractor} from '../utils';
import {OrganizationDoesNotExistError} from './errors';
import OrganizationQueries from './queries';
import {IPublicOrganization} from './types';

const organizationFields = getFields<IPublicOrganization>({
  organizationId: true,
  createdBy: true,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractor,
  lastUpdatedAt: getDateString,
  name: true,
  description: true,
});

export const organizationExtractor = makeExtract(organizationFields);
export const organizationListExtractor = makeListExtract(organizationFields);

export function throwOrganizationNotFound() {
  throw new OrganizationDoesNotExistError();
}

export async function checkOrganizationExists(
  ctx: IBaseContext,
  organizationId: string
) {
  return await ctx.data.organization.assertGetItem(
    OrganizationQueries.getById(organizationId)
  );
}

export async function checkOrganizationAuthorization(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  action: BasicCRUDActions
) {
  await checkAuthorizationForOrganization(context, agent, organization, action);
  return {agent, organization};
}

export async function checkOrganizationAuthorizationWithId(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions
) {
  const organization = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(id)
  );
  return checkOrganizationAuthorization(context, agent, organization, action);
}

export abstract class OrganizationUtils {
  static getPublicOrganization = organizationExtractor;
  static getPublicOrganizationList = organizationListExtractor;
  static throwOrganizationNotFound = throwOrganizationNotFound;
}

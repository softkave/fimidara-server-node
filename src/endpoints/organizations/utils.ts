import {IOrganization} from '../../definitions/organization';
import {
  ISessionAgent,
  BasicCRUDActions,
  AppResourceType,
} from '../../definitions/system';
import {getDateString, getDateStringIfPresent} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {checkAuthorization} from '../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../contexts/BaseContext';
import {NotFoundError} from '../errors';
import {agentExtractorIfPresent} from '../utils';
import OrganizationQueries from './queries';
import {IPublicOrganization} from './types';

const organizationFields = getFields<IPublicOrganization>({
  organizationId: true,
  createdBy: true,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
  name: true,
  description: true,
});

export const organizationExtractor = makeExtract(organizationFields);
export const organizationListExtractor = makeListExtract(organizationFields);

export function throwOrganizationNotFound() {
  throw new NotFoundError('Organization not found');
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
  action: BasicCRUDActions,
  nothrow = false
) {
  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    organization.organizationId,
    AppResourceType.Organization,
    [],
    action,
    nothrow
  );

  return {agent, organization};
}

export async function checkOrganizationAuthorization02(
  context: IBaseContext,
  agent: ISessionAgent,
  id: string,
  action: BasicCRUDActions,
  nothrow = false
) {
  const organization = await context.data.organization.assertGetItem(
    OrganizationQueries.getById(id)
  );
  return checkOrganizationAuthorization(
    context,
    agent,
    organization,
    action,
    nothrow
  );
}

export abstract class OrganizationUtils {
  static getPublicOrganization = organizationExtractor;
  static getPublicOrganizationList = organizationListExtractor;
  static throwOrganizationNotFound = throwOrganizationNotFound;
}

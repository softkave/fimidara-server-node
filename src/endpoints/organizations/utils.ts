import {
  IOrganization,
  IPublicOrganization,
} from '../../definitions/organization';
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
import {agentExtractor, agentExtractorIfPresent} from '../utils';
import OrganizationQueries from './queries';

const organizationFields = getFields<IPublicOrganization>({
  resourceId: true,
  createdBy: agentExtractor,
  createdAt: getDateString,
  lastUpdatedBy: agentExtractorIfPresent,
  lastUpdatedAt: getDateStringIfPresent,
  name: true,
  description: true,
  publicPresetId: true,
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
  if (
    agent.user &&
    agent.user.organizations.find(
      item => item.organizationId === organization.resourceId
    )
  ) {
    return {agent, organization};
  }

  await checkAuthorization({
    context,
    agent,
    organization,
    action,
    nothrow,
    resource: organization,
    type: AppResourceType.Organization,
    permissionOwners: [],
  });

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

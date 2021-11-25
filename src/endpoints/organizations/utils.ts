import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IBaseContext} from '../contexts/BaseContext';
import {OrganizationDoesNotExistError} from './errors';
import OrganizationQueries from './queries';
import {IPublicOrganization} from './types';

const organizationFields = getFields<IPublicOrganization>({
  organizationId: true,
  createdBy: true,
  createdAt: getDateString,
  lastUpdatedBy: true,
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

export abstract class OrganizationUtils {
  static getPublicOrganization = organizationExtractor;
  static getPublicOrganizationList = organizationListExtractor;
  static throwOrganizationNotFound = throwOrganizationNotFound;
}

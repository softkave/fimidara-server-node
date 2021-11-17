import {IOrganization} from '../../definitions/organization';
import {IUser} from '../../definitions/user';
import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
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

export function canReadOrganization(user: IUser, organization: IOrganization) {
  return user.organizations.find(
    organization => organization.organizationId === organization.organizationId
  );
}

export abstract class OrganizationUtils {
  static getPublicOrganization = organizationExtractor;
  static getPublicOrganizationList = organizationListExtractor;
  static throwOrganizationNotFound = throwOrganizationNotFound;
}

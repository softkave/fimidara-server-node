import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByOrganizationId(organizationId: string) {
  return newFilter().build();
}

function getByOrganizationIdAndUserEmail(
  organizationId: string,
  userEmail: string
) {
  return newFilter().build();
}

function getByUserEmail(userEmail: string) {
  return newFilter().build();
}

export default abstract class CollaboratorQueries {
  static getByOrganizationId = getByOrganizationId;
  static getByOrganizationIdAndUserEmail = getByOrganizationIdAndUserEmail;
  static getByUserEmail = getByUserEmail;
}

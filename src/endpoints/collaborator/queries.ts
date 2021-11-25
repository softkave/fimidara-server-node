import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByOrganizationId(organizationId: string) {
  return newFilter().build();
}

export default abstract class CollaboratorQueries {
  static getByOrganizationId = getByOrganizationId;
}

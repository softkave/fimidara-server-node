import {IUser} from '../../definitions/user';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IUser>();
}

function getByOrganizationId(organizationId: string) {
  return newFilter()
    .addItemWithStringKey(
      'organizations.organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

function getByOrganizationIdAndUserEmail(
  organizationId: string,
  userEmail: string
) {
  return newFilter()
    .addItemWithStringKey(
      'organizations.organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'email',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem(
      'email',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByIds(ids: string[], organizationId: string) {
  return newFilter()
    .addItem('resourceId', ids, DataProviderFilterValueOperator.In)
    .addItemWithStringKey(
      'organizations.organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

export default abstract class CollaboratorQueries {
  static getByOrganizationId = getByOrganizationId;
  static getByOrganizationIdAndUserEmail = getByOrganizationIdAndUserEmail;
  static getByUserEmail = getByUserEmail;
  static getByIds = getByIds;
}

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

function getById(id: string) {
  return newFilter()
    .addItem('userId', id, DataProviderFilterValueOperator.Equal)
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

function getByOrganizationIdAndUserId(organizationId: string, userId: string) {
  return newFilter()
    .addItemWithStringKey(
      'organizations.organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem('userId', userId, DataProviderFilterValueOperator.Equal)
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
    .addItem('userId', ids, DataProviderFilterValueOperator.In)
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
  static getById = getById;
  static getByOrganizationIdAndUserId = getByOrganizationIdAndUserId;
  static getByIds = getByIds;
}

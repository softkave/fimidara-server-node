import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<ICollaborationRequest>();
}

function getById(id: string) {
  return newFilter()
    .addItem('requestId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByIds(ids: string[]) {
  return newFilter()
    .addItem('requestId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function getByOrganizationId(organizationId: string) {
  return newFilter()
    .addItem(
      'organizationId',
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
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'recipientEmail',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

function getByUserEmail(userEmail: string) {
  return newFilter()
    .addItem(
      'recipientEmail',
      new RegExp(`^${userEmail}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

export default abstract class CollaborationRequestQueries {
  static getById = getById;
  static getByIds = getByIds;
  static getByOrganizationId = getByOrganizationId;
  static getByUserEmail = getByUserEmail;
  static getByOrganizationIdAndUserEmail = getByOrganizationIdAndUserEmail;
}

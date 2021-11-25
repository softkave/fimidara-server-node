import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
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

export default abstract class CollaborationRequestQueries {
  static getById = getById;
  static getByIds = getByIds;
  static getByOrganizationId = getByOrganizationId;
}

import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IClientAssignedToken>();
}

function getById(id: string) {
  return newFilter()
    .addItem('tokenId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationId(id: string) {
  return newFilter()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class ClientAssignedTokenQueries {
  static getById = getById;
  static getByOrganizationId = getByOrganizationId;
}

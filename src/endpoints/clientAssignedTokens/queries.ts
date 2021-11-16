import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IClientAssignedToken>();
}

function getById(id: string) {
  return newFilter()
    .addItem('tokenId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByEnvironmentId(id: string) {
  return newFilter()
    .addItem('environmentId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class ClientAssignedTokenQueries {
  static getById = getById;
  static getByEnvironmentId = getByEnvironmentId;
}
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IProgramAccessToken>();
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

function getByIds(ids: string[], organizationId: string) {
  return newFilter()
    .addItem('tokenId', ids, DataProviderFilterValueOperator.In)
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .build();
}

export default abstract class ProgramAccessTokenQueries {
  static getById = getById;
  static getByOrganizationId = getByOrganizationId;
  static getByIds = getByIds;
}

import {IOrganization} from '../../definitions/organization';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IOrganization>();
}

function getById(id: string) {
  return newFilter()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByIds(ids: string[]) {
  return newFilter()
    .addItem('organizationId', ids, DataProviderFilterValueOperator.In)
    .build();
}

function organizationExists(name: string) {
  return newFilter()
    .addItem('name', name, DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class OrganizationQueries {
  static getById = getById;
  static getByIds = getByIds;
  static organizationExists = organizationExists;
}

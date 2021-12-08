import {IOrganization} from '../../definitions/organization';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
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

function getByName(name: string) {
  return newFilter()
    .addItem(
      'name',
      new RegExp(`^${name}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

export default abstract class OrganizationQueries {
  static getById = getById;
  static getByIds = getByIds;
  static getByName = getByName;
}

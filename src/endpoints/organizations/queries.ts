import {IOrganization} from '../../definitions/organization';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IOrganization>();
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
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIds;
  static getByName = getByName;
}

import {DataProviderFilterValueOperator} from './contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from './contexts/data-providers/DataProviderFilterBuilder';

function getByOrganizationId(id: string) {
  return new DataProviderFilterBuilder<{organizationId: string}>()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationAndName(organizationId: string, name: string) {
  return new DataProviderFilterBuilder<{organizationId: string; name: string}>()
    .addItem(
      'organizationId',
      organizationId,
      DataProviderFilterValueOperator.Equal
    )
    .addItem(
      'name',
      new RegExp(`^${name}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

export default abstract class EndpointReusableQueries {
  static getByOrganizationId = getByOrganizationId;
  static getByOrganizationAndName = getByOrganizationAndName;
}

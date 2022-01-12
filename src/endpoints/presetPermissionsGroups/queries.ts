import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IPresetPermissionsGroup>();
}

function getByOrganizationAndName(organizationId: string, name: string) {
  return newFilter()
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

export default abstract class PresetPermissionsGroupQueries {
  static getByOrganizationId = EndpointReusableQueries.getByOrganizationId;
  static getByOrganizationAndName = getByOrganizationAndName;
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIdsAndOrgId;
}

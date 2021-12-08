import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPresetPermissionsGroup>();
}

function getById(id: string) {
  return newFilter()
    .addItem('presetId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationId(id: string) {
  return newFilter()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
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
  static getById = getById;
  static getByOrganizationId = getByOrganizationId;
  static getByOrganizationAndName = getByOrganizationAndName;
}

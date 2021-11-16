import {IPresetPermissionsItem} from '../../definitions/presetPermissionsItem';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPresetPermissionsItem>();
}

function getById(id: string) {
  return newFilter()
    .addItem('itemId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

function getByOrganizationId(id: string) {
  return newFilter()
    .addItem('organizationId', id, DataProviderFilterValueOperator.Equal)
    .build();
}

export default abstract class PresetPermissionItemQueries {
  static getById = getById;
  static getByOrganizationId = getByOrganizationId;
}

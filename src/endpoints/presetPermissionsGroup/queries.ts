import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPresetPermissionsGroup>();
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

export default abstract class PresetPermissionsGroupQueries {
  static getById = getById;
  static getByOrganizationId = getByOrganizationId;
}

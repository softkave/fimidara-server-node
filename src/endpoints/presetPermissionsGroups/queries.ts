import {IPresetPermissionsGroup} from '../../definitions/presetPermissionsGroup';
import {DataProviderFilterValueOperator} from '../contexts/data-providers/DataProvider';
import DataProviderFilterBuilder from '../contexts/data-providers/DataProviderFilterBuilder';
import EndpointReusableQueries from '../queries';

function newFilter() {
  return new DataProviderFilterBuilder<IPresetPermissionsGroup>();
}

function getByWorkspaceAndName(workspaceId: string, name: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem(
      'name',
      new RegExp(`^${name}$`, 'i'),
      DataProviderFilterValueOperator.Regex
    )
    .build();
}

export default abstract class PresetPermissionsGroupQueries {
  static getByWorkspaceId = EndpointReusableQueries.getByWorkspaceId;
  static getByWorkspaceAndName = getByWorkspaceAndName;
  static getById = EndpointReusableQueries.getById;
  static getByIds = EndpointReusableQueries.getByIdsAndWorkspaceId;
}

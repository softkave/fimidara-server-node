import {IPermissionGroup} from '../../definitions/permissionGroups';
import {DataProviderFilterValueOperator} from '../contexts/DataProvider';
import DataProviderFilterBuilder from '../contexts/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionGroup>();
}

function getByWorkspaceAndName(workspaceId: string, name: string) {
  return newFilter()
    .addItem('workspaceId', workspaceId, DataProviderFilterValueOperator.Equal)
    .addItem('name', new RegExp(`^${name}$`, 'i'), DataProviderFilterValueOperator.Regex)
    .build();
}

export default abstract class PermissionGroupQueries {
  static getByWorkspaceAndName = getByWorkspaceAndName;
}

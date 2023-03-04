import {IPermissionGroup} from '../../definitions/permissionGroups';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<IPermissionGroup>();
}

export default abstract class PermissionGroupQueries {}

import {PermissionGroup} from '../../definitions/permissionGroups';
import DataProviderFilterBuilder from '../contexts/data/DataProviderFilterBuilder';

function newFilter() {
  return new DataProviderFilterBuilder<PermissionGroup>();
}

export default abstract class PermissionGroupQueries {}

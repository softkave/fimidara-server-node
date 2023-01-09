import {IPermissionGroup} from '../../../../definitions/permissionGroups';
import {throwPermissionGroupNotFound} from '../../../permissionGroups/utils';
import {BaseMongoDataProvider} from '../utils';
import {IPermissionGroupDataProvider} from './type';

export class PermissionGroupMongoDataProvider
  extends BaseMongoDataProvider<IPermissionGroup>
  implements IPermissionGroupDataProvider
{
  throwNotFound = throwPermissionGroupNotFound;
}

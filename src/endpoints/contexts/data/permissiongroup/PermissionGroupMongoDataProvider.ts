import {IPermissionGroup} from '../../../../definitions/permissionGroups';
import {BaseMongoDataProvider} from '../utils';
import {IPermissionGroupDataProvider} from './type';

export class PermissionGroupMongoDataProvider
  extends BaseMongoDataProvider<IPermissionGroup>
  implements IPermissionGroupDataProvider {}

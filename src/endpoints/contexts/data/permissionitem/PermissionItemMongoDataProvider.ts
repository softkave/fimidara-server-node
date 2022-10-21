import {IPermissionItem} from '../../../../definitions/permissionItem';
import {BaseMongoDataProvider} from '../utils';
import {IPermissionItemDataProvider} from './type';

export class PermissionItemMongoDataProvider
  extends BaseMongoDataProvider<IPermissionItem>
  implements IPermissionItemDataProvider {}

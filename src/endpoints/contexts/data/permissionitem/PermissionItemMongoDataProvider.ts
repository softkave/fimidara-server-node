import {IPermissionItem} from '../../../../definitions/permissionItem';
import {throwPermissionItemNotFound} from '../../../permissionItems/utils';
import {BaseMongoDataProvider} from '../utils';
import {IPermissionItemDataProvider} from './type';

export class PermissionItemMongoDataProvider
  extends BaseMongoDataProvider<IPermissionItem>
  implements IPermissionItemDataProvider
{
  throwNotFound = throwPermissionItemNotFound;
}

import {IPermissionItem} from '../../../../definitions/permissionItem';
import {DataQuery, IBaseDataProvider} from '../types';

export type IPermissionItemQuery = DataQuery<IPermissionItem>;
export type IPermissionItemDataProvider = IBaseDataProvider<IPermissionItem>;

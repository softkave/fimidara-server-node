import {IPermissionGroup} from '../../../../definitions/permissionGroups';
import {DataQuery, IBaseDataProvider} from '../types';

export type IPermissionGroupQuery = DataQuery<IPermissionGroup>;
export type IPermissionGroupDataProvider = IBaseDataProvider<IPermissionGroup>;

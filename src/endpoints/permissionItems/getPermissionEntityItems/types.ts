import {PermissionEntityType} from '../../../definitions/permissionItem';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface IGetPermissionEntityPermissionItemsParams {
  permissionEntityId: string;
  permissionEntityType: PermissionEntityType;
}

export interface IGetPermissionEntityPermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type GetPermissionEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetPermissionEntityPermissionItemsParams,
  IGetPermissionEntityPermissionItemsResult
>;

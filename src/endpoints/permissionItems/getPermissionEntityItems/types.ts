import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface IGetPermissionEntityPermissionItemsParams {
  organizationId: string;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
}

export interface IGetPermissionEntityPermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type GetPermissionEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetPermissionEntityPermissionItemsParams,
  IGetPermissionEntityPermissionItemsResult
>;

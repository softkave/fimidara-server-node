import {PermissionEntityType} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface IGetResourcePermissionItemsParams {
  permissionEntityId: string;
  permissionEntityType: PermissionEntityType;
  resourceId: string;
  resourceType: AppResourceType;
}

export interface IGetResourcePermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetResourcePermissionItemsParams,
  IGetResourcePermissionItemsResult
>;

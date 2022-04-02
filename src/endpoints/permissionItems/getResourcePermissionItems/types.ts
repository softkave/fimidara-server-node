import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';
import {IPublicPermissionItem} from '../types';

export interface IGetResourcePermissionItemsParams {
  organizationId: string;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  permissionOwnerId?: string;
  permissionOwnerType?: AppResourceType;
}

export interface IGetResourcePermissionItemsResult {
  items: IPublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetResourcePermissionItemsParams,
  IGetResourcePermissionItemsResult
>;

import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {Endpoint, IPaginatedResult, IPaginationQuery} from '../../types';

export interface IGetResourcePermissionItemsEndpointParams extends IPaginationQuery {
  workspaceId?: string;
  targetId?: string;
  targetType: AppResourceType;
  containerId?: string;
  containerType?: AppResourceType;
}

export interface IGetResourcePermissionItemsEndpointResult extends IPaginatedResult {
  items: IPublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointResult
>;

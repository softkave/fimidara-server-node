import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetResourcePermissionItemsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {
  targetId?: string;
  targetType?: AppResourceType;
  containerId?: string;
}

export interface IGetResourcePermissionItemsEndpointParams
  extends IGetResourcePermissionItemsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetResourcePermissionItemsEndpointResult extends IPaginatedResult {
  items: IPublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetResourcePermissionItemsEndpointParams,
  IGetResourcePermissionItemsEndpointResult
>;

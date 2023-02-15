import {IPublicPermissionItem} from '../../../definitions/permissionItem';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
  IPaginatedResult,
  IPaginationQuery,
} from '../../types';

export interface IGetEntityPermissionItemsEndpointParamsBase
  extends IEndpointOptionalWorkspaceIDParam {
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
}

export interface IGetEntityPermissionItemsEndpointParams
  extends IGetEntityPermissionItemsEndpointParamsBase,
    IPaginationQuery {}

export interface IGetEntityPermissionItemsEndpointResult extends IPaginatedResult {
  items: IPublicPermissionItem[];
}

export type GetEntityPermissionItemsEndpoint = Endpoint<
  IBaseContext,
  IGetEntityPermissionItemsEndpointParams,
  IGetEntityPermissionItemsEndpointResult
>;

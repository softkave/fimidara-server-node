import {PublicPermissionItem} from '../../../definitions/permissionItem';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetEntityPermissionItemsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {
  entityId: string;
}

export interface GetEntityPermissionItemsEndpointParams
  extends GetEntityPermissionItemsEndpointParamsBase,
    PaginationQuery {}

export interface GetEntityPermissionItemsEndpointResult extends PaginatedResult {
  items: PublicPermissionItem[];
}

export type GetEntityPermissionItemsEndpoint = Endpoint<
  BaseContextType,
  GetEntityPermissionItemsEndpointParams,
  GetEntityPermissionItemsEndpointResult
>;

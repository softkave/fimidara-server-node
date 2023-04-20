import {PublicPermissionItem} from '../../../definitions/permissionItem';
import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  GetEntityPermissionItemsEndpointParams,
  GetEntityPermissionItemsEndpointResult
>;

import {IPublicPermissionItem} from '../../../definitions/permissionItem';
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

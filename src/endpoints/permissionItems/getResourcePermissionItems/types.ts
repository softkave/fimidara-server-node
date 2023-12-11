import {PublicPermissionItem} from '../../../definitions/permissionItem';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInputTarget} from '../types';

export interface GetResourcePermissionItemsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {
  target: PermissionItemInputTarget;
}

export interface GetResourcePermissionItemsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  target: PermissionItemInputTarget;
}

export interface GetResourcePermissionItemsEndpointResult {
  items: PublicPermissionItem[];
}

export type GetResourcePermissionItemsEndpoint = Endpoint<
  GetResourcePermissionItemsEndpointParams,
  GetResourcePermissionItemsEndpointResult
>;

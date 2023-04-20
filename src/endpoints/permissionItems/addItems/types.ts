import {PublicPermissionItem} from '../../../definitions/permissionItem';
import {BaseContext} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInput, PermissionItemInputEntity} from '../types';

export interface AddPermissionItemsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  entity?: PermissionItemInputEntity;
  items: PermissionItemInput[];
}

export interface AddPermissionItemsEndpointResult {
  items: PublicPermissionItem[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  BaseContext,
  AddPermissionItemsEndpointParams
  // AddPermissionItemsEndpointResult
>;

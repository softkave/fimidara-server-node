import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInput, PermissionItemInputEntity} from '../types';

export interface AddPermissionItemsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  entity?: PermissionItemInputEntity;
  items: PermissionItemInput[];
}

export type AddPermissionItemsEndpoint = Endpoint<
  BaseContextType,
  AddPermissionItemsEndpointParams
>;

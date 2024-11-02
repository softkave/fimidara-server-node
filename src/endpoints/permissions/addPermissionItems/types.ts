import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {PermissionItemInput} from '../types.js';

export interface AddPermissionItemsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  items: PermissionItemInput[];
}

export type AddPermissionItemsEndpoint =
  Endpoint<AddPermissionItemsEndpointParams>;

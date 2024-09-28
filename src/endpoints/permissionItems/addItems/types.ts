import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';
import {PermissionItemInput} from '../types.js';

export interface AddPermissionItemsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  items: PermissionItemInput[];
}

export type AddPermissionItemsEndpoint =
  Endpoint<AddPermissionItemsEndpointParams>;

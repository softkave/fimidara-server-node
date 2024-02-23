import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInput} from '../types';

export interface AddPermissionItemsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  items: PermissionItemInput[];
}

export type AddPermissionItemsEndpoint = Endpoint<AddPermissionItemsEndpointParams>;

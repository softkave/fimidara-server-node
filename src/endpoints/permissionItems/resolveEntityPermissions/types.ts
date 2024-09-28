import {FimidaraPermissionAction} from '../../../definitions/permissionItem.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';
import {PermissionItemInputTarget} from '../types.js';

export type ResolveEntityPermissionItemInputTarget = PermissionItemInputTarget;

export interface ResolveEntityPermissionItemInput
  extends PermissionItemInputTarget {
  action: FimidaraPermissionAction | FimidaraPermissionAction[];
  entityId: string | string[];
}

export interface ResolvedEntityPermissionItemTarget {
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface ResolvedEntityPermissionItem {
  target: ResolvedEntityPermissionItemTarget;
  action: FimidaraPermissionAction;
  entityId: string;
  access: boolean;
  permittingEntityId?: string;
  permittingTargetId?: string;
}

export interface ResolveEntityPermissionsEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  items: ResolveEntityPermissionItemInput[];
}

export interface ResolveEntityPermissionsEndpointResult {
  items: ResolvedEntityPermissionItem[];
}

export type ResolveEntityPermissionsEndpoint = Endpoint<
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult
>;

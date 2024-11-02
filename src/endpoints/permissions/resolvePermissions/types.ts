import {FimidaraPermissionAction} from '../../../definitions/permissionItem.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';
import {PermissionItemInputTarget} from '../types.js';

export type ResolvePermissionItemInputTarget = PermissionItemInputTarget;

export interface ResolvePermissionItemInput extends PermissionItemInputTarget {
  action: FimidaraPermissionAction | FimidaraPermissionAction[];
  entityId: string | string[];
}

export interface ResolvedPermissionItemTarget {
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface ResolvedPermissionItem {
  target: ResolvedPermissionItemTarget;
  action: FimidaraPermissionAction;
  entityId: string;
  access: boolean;
  permittingEntityId?: string;
  permittingTargetId?: string;
}

export interface ResolvePermissionsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  items: ResolvePermissionItemInput[];
}

export interface ResolvePermissionsEndpointResult {
  items: ResolvedPermissionItem[];
}

export type ResolvePermissionsEndpoint = Endpoint<
  ResolvePermissionsEndpointParams,
  ResolvePermissionsEndpointResult
>;

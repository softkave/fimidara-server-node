import {PermissionAction} from '../../../definitions/permissionItem';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInputTarget} from '../types';

export type ResolveEntityPermissionItemInputTarget = Pick<
  PermissionItemInputTarget,
  'filepath' | 'folderpath' | 'targetId' | 'workspaceRootname'
>;

export interface ResolveEntityPermissionItemInput {
  target:
    | ResolveEntityPermissionItemInputTarget
    | ResolveEntityPermissionItemInputTarget[];
  action: PermissionAction | PermissionAction[];
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
  action: PermissionAction;
  entityId: string;
  hasAccess: boolean;
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

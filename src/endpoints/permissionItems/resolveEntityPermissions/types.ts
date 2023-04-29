import {AppActionType, AppResourceType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';

export interface ResolveEntityPermissionItemInput {
  target: PermissionItemInputTarget | PermissionItemInputTarget[];
  action: AppActionType | AppActionType[];
  entity?: PermissionItemInputEntity;
}

export interface ResolvedEntityPermissionItemTarget {
  targetId?: string;
  targetType?: AppResourceType;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface ResolvedEntityPermissionItemResult {
  target: ResolvedEntityPermissionItemTarget;
  action: AppActionType;
  entityId: string;
  hasAccess: boolean;
}

export interface ResolveEntityPermissionsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  entity?: PermissionItemInputEntity;
  items: ResolveEntityPermissionItemInput[];
}

export interface ResolveEntityPermissionsEndpointResult {
  items: ResolvedEntityPermissionItemResult[];
}

export type ResolveEntityPermissionsEndpoint = Endpoint<
  BaseContextType,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult
>;

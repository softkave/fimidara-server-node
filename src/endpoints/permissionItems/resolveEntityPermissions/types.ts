import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../../definitions/system';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';
import {PermissionItemInputEntity, PermissionItemInputTarget} from '../types';

export enum ResolveEntityPermissionItemAppliesToResolutionMethod {
  Together = 'together',
  Individually = 'individually',
  TotalMixAndMatch = 'totalMixAndMatch',
  ContainerToTargetMixAndMatch = 'containerToTargetMixAndMatch',
  TargetToContainerMixAndMatch = 'targetToContainerMixAndMatch',
}

export interface ResolveEntityPermissionItemInputTarget extends PermissionItemInputTarget {}

export interface ResolveEntityPermissionItemInput {
  target: ResolveEntityPermissionItemInputTarget | ResolveEntityPermissionItemInputTarget[];
  action: AppActionType | AppActionType[];
  entity?: PermissionItemInputEntity;
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];

  // TODO: expressive mix-matching
  // includeEmptyContainerAppliesTo?: boolean;
  // includeEmptyTargetAppliesTo?: boolean;
  // appliesToResolutionMethod?: ResolveEntityPermissionItemAppliesToResolutionMethod;
}

export interface ResolvedEntityPermissionItemTarget {
  targetId?: string;
  targetType?: AppResourceType;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface ResolvedEntityPermissionItem {
  target: ResolvedEntityPermissionItemTarget;
  action: AppActionType;
  entityId: string;
  hasAccess: boolean;
  containerAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  targetAppliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  accessEntityId?: string;
  // accessTargetId?: string;
  // accessTargetType?: AppResourceType;
}

export interface ResolveEntityPermissionsEndpointParams extends EndpointOptionalWorkspaceIDParam {
  entity?: PermissionItemInputEntity;
  items: ResolveEntityPermissionItemInput[];
}

export interface ResolveEntityPermissionsEndpointResult {
  items: ResolvedEntityPermissionItem[];
}

export type ResolveEntityPermissionsEndpoint = Endpoint<
  BaseContextType,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult
>;

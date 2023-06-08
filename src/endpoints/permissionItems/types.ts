import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../definitions/system';
import {LongRunningJobResult} from '../jobs/types';
import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {AddPermissionItemsEndpoint, AddPermissionItemsEndpointParams} from './addItems/types';
import {
  DeletePermissionItemsEndpoint,
  DeletePermissionItemsEndpointParams,
} from './deleteItems/types';
import {
  ResolveEntityPermissionsEndpoint,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
} from './resolveEntityPermissions/types';

export interface PermissionItemInputTarget {
  targetId?: string | string[];
  targetType?: AppResourceType | AppResourceType[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export interface PermissionItemInputEntity {
  /** Must be user, permission group, or agent token IDs. */
  entityId: string | string[];
}

export interface PermissionItemInput {
  target: PermissionItemInputTarget | PermissionItemInputTarget[];
  action: AppActionType | AppActionType[];
  grantAccess: boolean;
  appliesTo?: PermissionItemAppliesTo | PermissionItemAppliesTo[];
  entity?: PermissionItemInputEntity;
}

export type AddPermissionItemsHttpEndpoint = HttpEndpoint<
  AddPermissionItemsEndpoint,
  AddPermissionItemsEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  {}
>;
export type DeletePermissionItemsHttpEndpoint = HttpEndpoint<
  DeletePermissionItemsEndpoint,
  DeletePermissionItemsEndpointParams,
  LongRunningJobResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type ResolveEntityPermissionsHttpEndpoint = HttpEndpoint<
  ResolveEntityPermissionsEndpoint,
  ResolveEntityPermissionsEndpointParams,
  ResolveEntityPermissionsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;

export type PermissionItemsExportedEndpoints = {
  addItems: ExportedHttpEndpointWithMddocDefinition<AddPermissionItemsHttpEndpoint>;
  deleteItems: ExportedHttpEndpointWithMddocDefinition<DeletePermissionItemsHttpEndpoint>;
  resolveEntityPermissions: ExportedHttpEndpointWithMddocDefinition<ResolveEntityPermissionsHttpEndpoint>;
};

import {PermissionAction} from '../../definitions/permissionItem';
import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddPermissionItemsEndpoint} from './addItems/types';
import {DeletePermissionItemsEndpoint} from './deleteItems/types';
import {ResolveEntityPermissionsEndpoint} from './resolveEntityPermissions/types';

export interface PermissionItemInputTarget {
  targetId?: string | string[];
  filepath?: string | string[];
  folderpath?: string | string[];
  workspaceRootname?: string;
}

export interface ResolvedEntityPermissionItemTarget {
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}

export interface PermissionItemInput {
  target: PermissionItemInputTarget | PermissionItemInputTarget[];
  action: PermissionAction | PermissionAction[];
  access: boolean;
  entityId: string | string[];
}

export type AddPermissionItemsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<AddPermissionItemsEndpoint>;
export type DeletePermissionItemsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<DeletePermissionItemsEndpoint>;
export type ResolveEntityPermissionsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ResolveEntityPermissionsEndpoint>;

export type PermissionItemsExportedEndpoints = {
  addItems: AddPermissionItemsHttpEndpoint;
  deleteItems: DeletePermissionItemsHttpEndpoint;
  resolveEntityPermissions: ResolveEntityPermissionsHttpEndpoint;
};

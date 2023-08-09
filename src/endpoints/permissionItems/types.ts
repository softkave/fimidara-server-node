import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../definitions/system';
import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {AddPermissionItemsEndpoint} from './addItems/types';
import {DeletePermissionItemsEndpoint} from './deleteItems/types';
import {ResolveEntityPermissionsEndpoint} from './resolveEntityPermissions/types';

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

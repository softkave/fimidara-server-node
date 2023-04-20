import {PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {AppActionType, AppResourceType} from '../../definitions/system';
import {ExportedHttpEndpoint} from '../types';
import {AddPermissionItemsEndpoint} from './addItems/types';
import {DeletePermissionItemsEndpoint} from './deleteItems/types';

export interface PermissionItemInputTarget {
  targetId: string | string[];
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
  appliesTo: PermissionItemAppliesTo;
  entity?: PermissionItemInputEntity;
}

export type PermissionItemsExportedEndpoints = {
  addItems: ExportedHttpEndpoint<AddPermissionItemsEndpoint>;
  deleteItems: ExportedHttpEndpoint<DeletePermissionItemsEndpoint>;
};

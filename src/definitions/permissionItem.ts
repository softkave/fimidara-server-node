import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export enum PermissionItemAppliesTo {
  Owner = 'owner',
  OwnerAndChildren = 'owner-and-children',
  Children = 'children',
}

export interface IPermissionItem {
  resourceId: string;
  workspaceId: string;
  createdAt: Date | string;
  createdBy: IAgent;

  // Owners are file, folder and workspace.
  // The action defined in the permission item will affect
  // the permission owner, and it's children resources.
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;

  // Entities are user token, client assigned token,
  // program access token and preset permission groups.
  // It's the entity this permission item was created for.
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
  hash: string;
}

export interface IPublicPermissionItem {
  resourceId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: IAgent;
  permissionOwnerId: string;
  permissionOwnerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  itemResourceId?: string;
  itemResourceType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
}

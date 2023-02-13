import {AppResourceType, BasicCRUDActions, IAgent} from './system';

export enum PermissionItemAppliesTo {
  Container = 'container',
  ContainerAndChildren = 'container-and-children',
  Children = 'children',
}

export interface IPermissionItem {
  resourceId: string;
  workspaceId: string;
  createdAt: Date | string;
  createdBy: IAgent;

  // Containers scope the reach of a permission item to only the resources they
  // contain. Currently, there's only workspace and folder.
  containerId: string;
  containerType: AppResourceType;

  // Entities are user token, client assigned token,
  // program access token and permissionGroup permission groups.
  // It's the entity this permission item was created for.
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  targetId?: string;
  targetType: AppResourceType;
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
  containerId: string;
  containerType: AppResourceType;
  permissionEntityId: string;
  permissionEntityType: AppResourceType;
  targetId?: string;
  targetType: AppResourceType;
  action: BasicCRUDActions;
  grantAccess: boolean;
  appliesTo: PermissionItemAppliesTo;
}

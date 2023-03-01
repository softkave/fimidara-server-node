import {IAgent, IWorkspaceResourceBase} from './system';

export interface IPermissionGroup extends IWorkspaceResourceBase {
  name: string;
  description?: string;
}

export interface IAssignedPermissionGroupMeta {
  permissionGroupId: string;
  assignedToEntityId: string;
  assignedAt: number;
  assignedBy: IAgent;
}

export type PermissionEntityInheritanceMapItem = {
  id: string;
  items: IAssignedPermissionGroupMeta[];

  // Order resolved in context of an inheritance map
  resolvedOrder?: number;
};

export type PermissionEntityInheritanceMap = Record<string, PermissionEntityInheritanceMapItem>;

export interface IPermissionGroupMatcher {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
}

export type IPublicPermissionGroup = IPermissionGroup;

export interface IAssignPermissionGroupInput {
  permissionGroupId: string;
}

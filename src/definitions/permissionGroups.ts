import {Agent, ToPublicDefinitions, WorkspaceResource} from './system.js';

export interface PermissionGroup extends WorkspaceResource {
  name: string;
  description?: string;
}

export interface AssignedPermissionGroupMeta {
  permissionGroupId: string;
  assigneeEntityId: string;
  assignedAt: number;
  assignedBy: Agent;
}

export type PermissionEntityInheritanceMapItem = {
  id: string;
  items: AssignedPermissionGroupMeta[];

  // Order resolved in context of an inheritance map
  resolvedOrder?: number;
};

export type PermissionEntityInheritanceMap = Record<
  string,
  PermissionEntityInheritanceMapItem
>;

export interface PermissionGroupMatcher {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
}

export type PublicPermissionGroup = ToPublicDefinitions<PermissionGroup>;
export type PublicAssignedPermissionGroupMeta =
  ToPublicDefinitions<AssignedPermissionGroupMeta>;

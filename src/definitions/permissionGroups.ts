import {Agent, ConvertAgentToPublicAgent, WorkspaceResource} from './system';

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

export type PermissionEntityInheritanceMap = Record<string, PermissionEntityInheritanceMapItem>;

export interface PermissionGroupMatcher {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
}

export interface AssignPermissionGroupInput {
  permissionGroupId: string;
}

export type PublicPermissionGroup = ConvertAgentToPublicAgent<PermissionGroup>;
export type PublicAssignedPermissionGroupMeta =
  ConvertAgentToPublicAgent<AssignedPermissionGroupMeta>;

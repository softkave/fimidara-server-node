import {EndpointOptionalWorkspaceIdParam} from '../endpoints/types.js';
import {Agent, ToPublicDefinitions, WorkspaceResource} from './system.js';

export interface PermissionGroup extends WorkspaceResource {
  name: string;
  description?: string;
}

export interface AssignedPermissionGroupMeta {
  permissionGroupId: string;
  assigneeId: string;
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

export interface PermissionGroupMatcher
  extends EndpointOptionalWorkspaceIdParam {
  permissionGroupId?: string;
  name?: string;
}

export type PublicPermissionGroup = ToPublicDefinitions<PermissionGroup>;
export type PublicAssignedPermissionGroupMeta =
  ToPublicDefinitions<AssignedPermissionGroupMeta>;

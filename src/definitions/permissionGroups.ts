import {ConvertAgentToPublicAgent, IAgent, IWorkspaceResource} from './system';

export interface IPermissionGroup extends IWorkspaceResource {
  name: string;
  description?: string;
}

export interface IAssignedPermissionGroupMeta {
  permissionGroupId: string;
  assigneeEntityId: string;
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

export interface IAssignPermissionGroupInput {
  permissionGroupId: string;
}

export type IPublicPermissionGroup = ConvertAgentToPublicAgent<IPermissionGroup>;
export type IPublicAssignedPermissionGroupMeta =
  ConvertAgentToPublicAgent<IAssignedPermissionGroupMeta>;

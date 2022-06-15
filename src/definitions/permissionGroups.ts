import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IPermissionGroup {
  resourceId: string;
  workspaceId: string;
  createdAt: Date | string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  name: string;
  description?: string;
}

export interface IAssignedPermissionGroup {
  permissionGroupId: string;
  assignedAt: Date | string;
  assignedBy: IAgent;
  order: number;
}

export interface IPermissionGroupMatcher {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
}

export interface IPublicPermissionGroup {
  resourceId: string;
  workspaceId: string;
  createdAt: string;
  createdBy: IAgent;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  name: string;
  description?: string;
  permissionGroups: IAssignedPermissionGroup[];
  tags: IAssignedTag[];
}

export interface IPermissionGroupInput {
  permissionGroupId: string;
  order?: number;
}

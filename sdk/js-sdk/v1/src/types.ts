// This file is auto-generated, do not modify directly. 
// Reach out to @abayomi to suggest changes.

import {Readable} from "isomorphic-form-data"
import {Headers} from "cross-fetch"

export type ImageTransformationParams = {
  width?: string;
  height?: string;
}
export type GetFileEndpointParams = {
  filepath?: string;
  fileId?: string;
  imageTranformation?: ImageTransformationParams;
}
export type ReadFileEndpointRequestParams = {
  authToken?: string;
  body: GetFileEndpointParams;
}
export type ReadFileEndpointResult = {
  body: string | Readable | ReadableStream;
  headers: typeof Headers;
}
export type AddWorkspaceEndpointParams = {
  name: string;
  rootname: string;
  description?: string;
}
export type AgentType = "user" | "agentToken"
export type Agent = {
  agentId: string;
  agentType: AgentType;
  agentTokenId: string;
}
export type WorkspaceBillStatus = "ok" | "gracePeriod" | "billOverdue"
export type UsageRecordCategory = "s" | "bin" | "bout" | "t"
export type UsageThreshold = {
  lastUpdatedBy?: Agent;
  lastUpdatedAt?: string;
  category: UsageRecordCategory;
  budget: number;
}
export type WorkspaceUsageThresholds = {
  s?: undefined | UsageThreshold;
  bin?: undefined | UsageThreshold;
  bout?: undefined | UsageThreshold;
  t?: undefined | UsageThreshold;
}
export type UsageThresholdLock = {
  lastUpdatedBy?: Agent;
  lastUpdatedAt?: string;
  category: UsageRecordCategory;
  locked: boolean;
}
export type WorkspaceUsageThresholdLocks = {
  s?: undefined | UsageThresholdLock;
  bin?: undefined | UsageThresholdLock;
  bout?: undefined | UsageThresholdLock;
  t?: undefined | UsageThresholdLock;
}
export type Workspace = {
  resourceId?: string;
  workspaceId?: string;
  providedResourceId?: undefined | string;
  createdBy?: Agent;
  createdAt?: string;
  lastUpdatedBy?: Agent;
  lastUpdatedAt?: string;
  name: string;
  rootname: string;
  description: string;
  publicPermissionGroupId?: undefined | string;
  billStatusAssignedAt?: undefined | string;
  billStatus?: undefined | WorkspaceBillStatus;
  usageThresholds?: undefined | WorkspaceUsageThresholds;
  usageThresholdLocks?: undefined | WorkspaceUsageThresholdLocks;
}
export type AddWorkspaceEndpointSuccessResult = {
  workspace?: Workspace;
}
export type AddWorkspaceEndpointRequestParams = {
  authToken?: string;
  body: AddWorkspaceEndpointParams;
}
export type AddWorkspaceEndpointResult = {
  body: AddWorkspaceEndpointSuccessResult;
  headers: typeof Headers;
}
export type WorkspaceAppResourceType = "*" | "workspace" | "collaborationRequest" | "agentToken" | "permissionGroup" | "permissionItem" | "folder" | "file" | "user" | "tag" | "usageRecord"
export type NewPermissionItemInputTarget = {
  targetType: WorkspaceAppResourceType;
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
}
export type AppActionType = "*" | "create" | "read" | "update" | "delete" | "grantPermission"
export type PermissionItemAppliesTo = "s" | "sc" | "c"
export type NewPermissionItemInput = {
  target?: NewPermissionItemInputTarget;
  grantAccess?: boolean;
  entity?: string;
  action: AppActionType;
  appliesTo: PermissionItemAppliesTo;
}
export type AddPermissionItemsEndpointParams = {
  entity?: string;
  workspaceId?: string;
  items?: Array<NewPermissionItemInput>;
}
export type EntityAppResourceType = "user" | "permissionGroup" | "agentToken"
export type PermissionItem = {
  entityId?: string;
  entityType?: EntityAppResourceType;
  targetType: WorkspaceAppResourceType;
  resourceId?: string;
  createdBy?: Agent;
  createdAt?: string;
  workspaceId?: string;
  targetId?: undefined | string;
  action: AppActionType;
  grantAccess?: boolean;
  lastUpdatedAt?: string;
  lastUpdatedBy?: Agent;
  providedResourceId?: undefined | string;
  appliesTo: PermissionItemAppliesTo;
}
export type AddPermissionItemsEndpointSuccessResult = {
  items?: Array<PermissionItem>;
}
export type AddPermissionItemsEndpointRequestParams = {
  authToken?: string;
  body: AddPermissionItemsEndpointParams;
}
export type AddPermissionItemsEndpointResult = {
  body: AddPermissionItemsEndpointSuccessResult;
  headers: typeof Headers;
}

export type ReadFileEndpoint = (params: ReadFileEndpointRequestParams) => Promise<ReadFileEndpointResult>
export type AddWorkspaceEndpoint = (params: AddWorkspaceEndpointRequestParams) => Promise<AddWorkspaceEndpointResult>
export type AddPermissionItemsEndpoint = (params: AddPermissionItemsEndpointRequestParams) => Promise<AddPermissionItemsEndpointResult>
export type Endpoints = {
  files: {
    readFile: ReadFileEndpoint;
  }
  workspaces: {
    addWorkspace: AddWorkspaceEndpoint;
  }
  permissionItems: {
    addItems: AddPermissionItemsEndpoint;
  }
}

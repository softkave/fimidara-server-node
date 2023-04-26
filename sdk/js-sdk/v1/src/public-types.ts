// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {Readable} from 'isomorphic-form-data';

export type NewAgentTokenInput = {
  name?: string;
  description?: string;
  expires?: number;
  providedResourceId?: string;
};
export type AddAgentTokenEndpointParams = {
  workspaceId?: string;
  token: NewAgentTokenInput;
};
export type AgentType = 'user' | 'agentToken';
export type Agent = {
  agentId: string;
  agentType: AgentType;
};
export type AgentToken = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  name?: string;
  description?: string;
  workspaceId: string;
  tokenStr: string;
  expires?: number;
  providedResourceId?: string;
};
export type AddAgentTokenEndpointSuccessResult = {
  token: AgentToken;
};
export type DeleteAgentTokenEndpointParams = {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  workspaceId?: string;
};
export type LongRunningJobResult = {
  jobId: string;
};
export type GetAgentTokenEndpointParams = {
  workspaceId?: string;
  providedResourceId?: string;
  tokenId?: string;
  onReferenced?: boolean;
};
export type GetAgentTokenEndpointResult = {
  token: AgentToken;
};
export type GetWorkspaceAgentTokensEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspaceAgentTokensEndpointResult = {
  tokens: Array<AgentToken>;
  page: number;
};
export type CountWorkspaceAgentTokensEndpointParams = {
  workspaceId?: string;
};
export type CountItemsResult = {
  count: number;
};
export type UpdateAgentTokenEndpointParams = {
  workspaceId?: string;
  tokenId?: string;
  onReferenced?: boolean;
  token: NewAgentTokenInput;
  providedResourceId?: string;
};
export type UpdateAgentTokenEndpointSuccessResult = {
  token: AgentToken;
};
export type DeleteCollaborationRequestEndpointParams = {
  requestId: string;
};
export type GetCollaborationRequestEndpointParams = {
  requestId: string;
};
export type CollaborationRequestStatusType =
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'pending';
export type CollaborationRequestForUser = {
  recipientEmail: string;
  message: string;
  resourceId: string;
  createdAt: number;
  expiresAt?: number;
  workspaceName: string;
  lastUpdatedAt: number;
  readAt?: number;
  status: CollaborationRequestStatusType;
  statusDate: number;
};
export type GetCollaborationRequestEndpointSuccessResult = {
  request: CollaborationRequestForUser;
};
export type GetUserCollaborationRequestsEndpointParams = {
  page?: number;
  pageSize?: number;
};
export type GetUserCollaborationRequestsEndpointSuccessResult = {
  requests: Array<CollaborationRequestForUser>;
  page: number;
};
export type GetWorkspaceCollaborationRequestsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type CollaborationRequestForWorkspace = {
  recipientEmail: string;
  message: string;
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  expiresAt?: number;
  workspaceName: string;
  workspaceId: string;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  readAt?: number;
  status: CollaborationRequestStatusType;
  statusDate: number;
  providedResourceId?: string;
};
export type GetWorkspaceCollaborationRequestsEndpointSuccessResult = {
  requests: Array<CollaborationRequestForWorkspace>;
  page: number;
};
export type CountWorkspaceCollaborationRequestsEndpointParams = {
  workspaceId?: string;
};
export type CollaborationRequestResponseType = 'accepted' | 'declined';
export type RespondToCollaborationRequestEndpointParams = {
  requestId: string;
  response: CollaborationRequestResponseType;
};
export type RespondToCollaborationRequestEndpointSuccessResult = {
  request: CollaborationRequestForUser;
};
export type RevokeCollaborationRequestEndpointParams = {
  requestId: string;
};
export type RevokeCollaborationRequestEndpointSuccessResult = {
  request: CollaborationRequestForWorkspace;
};
export type NewCollaborationRequestInput = {
  recipientEmail: string;
  message: string;
  expires?: number;
};
export type SendCollaborationRequestEndpointParams = {
  workspaceId?: string;
  request: NewCollaborationRequestInput;
};
export type SendCollaborationRequestEndpointSuccessResult = {
  request: CollaborationRequestForWorkspace;
};
export type UpdateCollaborationRequestInput = {
  message?: string;
  expires?: number;
};
export type UpdateCollaborationRequestEndpointParams = {
  requestId: string;
  request: UpdateCollaborationRequestInput;
};
export type UpdateCollaborationRequestEndpointSuccessResult = {
  request: CollaborationRequestForWorkspace;
};
export type GetCollaboratorEndpointParams = {
  workspaceId?: string;
  collaboratorId: string;
};
export type Collaborator = {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  workspaceId: string;
  joinedAt: number;
};
export type GetCollaboratorEndpointSuccessResult = {
  collaborator: Collaborator;
};
export type GetWorkspaceCollaboratorsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspaceCollaboratorsEndpointSuccessResult = {
  collaborators: Array<Collaborator>;
  page: number;
};
export type CountWorkspaceCollaboratorsEndpointParams = {
  workspaceId?: string;
};
export type RevokeCollaboratorEndpointParams = {
  workspaceId?: string;
  collaboratorId: string;
};
export type DeleteFileEndpointParams = {
  filepath?: string;
  fileId?: string;
};
export type GetFileDetailsEndpointParams = {
  filepath?: string;
  fileId?: string;
};
export type File = {
  size: number;
  extension: string;
  resourceId: string;
  workspaceId: string;
  parentId: string;
  idPath: Array<string>;
  namePath: Array<string>;
  mimetype?: string;
  encoding?: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  name: string;
  description?: string;
  providedResourceId?: string;
};
export type GetFileDetailsEndpointSuccessResult = {
  file: File;
};
export type ImageTransformationParams = {
  width?: string;
  height?: string;
};
export type ReadFileEndpointParams = {
  filepath?: string;
  fileId?: string;
  imageTranformation?: ImageTransformationParams;
};
export type UpdateFileDetailsInput = {
  description?: string;
  mimetype?: string;
};
export type UpdateFileDetailsEndpointParams = {
  file: UpdateFileDetailsInput;
  filepath?: string;
  fileId?: string;
};
export type UpdateFileDetailsEndpointSuccessResult = {
  file: File;
};
export type UploadFileEndpointParams = {
  filepath?: string;
  fileId?: string;
  data: string | Readable | ReadableStream;
  description?: string;
  mimetype?: string;
  encoding?: string;
  extension?: string;
};
export type UploadFileEndpointSuccessResult = {
  file: File;
};
export type NewFolderInput = {
  description?: string;
  folderpath: string;
};
export type AddFolderEndpointParams = {
  folder: NewFolderInput;
};
export type Folder = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  name: string;
  description?: string;
  workspaceId: string;
  idPath: Array<string>;
  namePath: Array<string>;
  parentId: string;
  providedResourceId?: string;
};
export type AddFolderEndpointSuccessResult = {
  folder: Folder;
};
export type DeleteFolderEndpointParams = {
  folderpath?: string;
  folderId?: string;
};
export type GetFolderEndpointParams = {
  folderpath?: string;
  folderId?: string;
};
export type GetFolderEndpointSuccessResult = {
  folder: Folder;
};
export type ListFolderContentEndpointParams = {
  folderpath?: string;
  folderId?: string;
  contentType?: 'file' | 'folder';
  page?: number;
  pageSize?: number;
};
export type ListFolderContentEndpointSuccessResult = {
  folders: Array<Folder>;
  files: Array<File>;
  page: number;
};
export type CountFolderContentEndpointParams = {
  folderpath?: string;
  folderId?: string;
  contentType?: 'file' | 'folder';
};
export type CountFolderContentEndpointSuccessResult = {
  foldersCount: number;
  filesCount: number;
};
export type UpdateFolderInput = {
  description?: string;
};
export type UpdateFolderEndpointParams = {
  folderpath?: string;
  folderId?: string;
  folder: UpdateFolderInput;
};
export type UpdateFolderEndpointSuccessResult = {
  folder: Folder;
};
export type GetJobStatusEndpointParams = {
  workspaceId?: string;
  jobId: string;
};
export type JobStatus = 'pending' | 'inProgress' | 'completed' | 'failed';
export type GetJobStatusEndpointResult = {
  status: JobStatus;
};
export type NewPermissionGroupInput = {
  name: string;
  description?: string;
};
export type AddPermissionGroupEndpointParams = {
  workspaceId?: string;
  permissionGroup: NewPermissionGroupInput;
};
export type PermissionGroup = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  workspaceId: string;
  name: string;
  description?: string;
  providedResourceId?: string;
};
export type AddPermissionGroupEndpointSuccessResult = {
  permissionGroup: PermissionGroup;
};
export type AssignPermissionGroupInput = {
  permissionGroupId: string;
};
export type AssignPermissionGroupsEndpointParams = {
  workspaceId?: string;
  entityId: string;
  permissionGroups: Array<AssignPermissionGroupInput>;
};
export type DeletePermissionGroupEndpointParams = {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
};
export type GetPermissionGroupEndpointParams = {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
};
export type GetPermissionGroupEndpointSuccessResult = {
  permissionGroup: PermissionGroup;
};
export type GetEntityAssignedPermissionGroupsParams = {
  workspaceId?: string;
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
};
export type GetEntityAssignedPermissionGroupsEndpointSuccessResult = {
  permissionGroups: Array<PermissionGroup>;
  immediateAssignedPermissionGroupsMeta: Array<PermissionGroup>;
};
export type GetWorkspacePermissionGroupsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspacePermissionGroupsEndpointSuccessResult = {
  permissionGroups: Array<PermissionGroup>;
  page: number;
};
export type CountWorkspacePermissionGroupsEndpointParams = {
  workspaceId?: string;
};
export type UpdatePermissionGroupInput = {
  name?: string;
  description?: string;
};
export type UpdatePermissionGroupEndpointParams = {
  permissionGroupId?: string;
  name?: string;
  workspaceId?: string;
  data: UpdatePermissionGroupInput;
};
export type UpdatePermissionGroupEndpointSuccessResult = {
  permissionGroup: PermissionGroup;
};
export type NewPermissionItemInputEntity = {
  entityId: string;
};
export type WorkspaceAppResourceType =
  | '*'
  | 'workspace'
  | 'collaborationRequest'
  | 'agentToken'
  | 'permissionGroup'
  | 'permissionItem'
  | 'folder'
  | 'file'
  | 'user'
  | 'tag'
  | 'usageRecord';
export type NewPermissionItemInputTarget = {
  targetType?: WorkspaceAppResourceType;
  targetId: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
};
export type AppActionType =
  | '*'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'grantPermission';
export type PermissionItemAppliesTo = 'self' | 'selfAndChildren' | 'children';
export type NewPermissionItemInput = {
  target: NewPermissionItemInputTarget;
  grantAccess: boolean;
  entity?: NewPermissionItemInputEntity;
  action: AppActionType;
  appliesTo: PermissionItemAppliesTo;
};
export type AddPermissionItemsEndpointParams = {
  entity?: NewPermissionItemInputEntity;
  workspaceId?: string;
  items: Array<NewPermissionItemInput>;
};
export type DeletePermissionItemInputTarget = {
  targetType?: WorkspaceAppResourceType;
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
};
export type DeletePermissionItemInput = {
  target: DeletePermissionItemInputTarget;
  action?: AppActionType;
  grantAccess?: boolean;
  entity?: NewPermissionItemInputEntity;
  appliesTo?: PermissionItemAppliesTo;
};
export type DeletePermissionItemsEndpointParams = {
  workspaceId?: string;
  items?: Array<DeletePermissionItemInput>;
  entity?: NewPermissionItemInputEntity;
};
export type FetchResourceItem = {
  resourceId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
};
export type ResourceWrapper = {
  workspaceId?: string;
  resources: Array<FetchResourceItem>;
};
export type GetResourcesEndpointResult = {
  resources: Array<ResourceWrapper>;
};
export type UsageCosts = {
  storage: number;
  bin: number;
  bout: number;
  total: number;
};
export type GetUsageCostsEndpointResult = {
  costs: UsageCosts;
};
export type UsageRecordCategory = 'storage' | 'bin' | 'bout' | 'total';
export type UsageRecordFulfillmentStatus =
  | 'undecided'
  | 'fulfilled'
  | 'dropped';
export type SummedUsageQuery = {
  category?: Array<UsageRecordCategory>;
  fromDate?: number;
  toDate?: number;
  fulfillmentStatus?: Array<UsageRecordFulfillmentStatus>;
};
export type GetWorkspaceSummedUsageEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
  query?: SummedUsageQuery;
};
export type UsageRecord = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  category: UsageRecordCategory;
  usage: number;
  usageCost: number;
  fulfillmentStatus: UsageRecordFulfillmentStatus;
  month: number;
  year: number;
  providedResourceId?: string;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  workspaceId: string;
};
export type GetWorkspaceSummedUsageEndpointResult = {
  records: Array<UsageRecord>;
  page: number;
};
export type CountWorkspaceSummedUsageEndpointParams = {
  workspaceId?: string;
  query?: SummedUsageQuery;
};
export type UserWorkspace = {
  joinedAt: number;
  workspaceId: string;
};
export type PublicUser = {
  resourceId: string;
  createdAt: number;
  lastUpdatedAt: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordLastChangedAt: number;
  isEmailVerified: boolean;
  emailVerifiedAt?: number;
  emailVerificationEmailSentAt?: number;
  workspaces: Array<UserWorkspace>;
};
export type LoginResult = {
  user: PublicUser;
  token: string;
  clientAssignedToken: string;
};
export type UpdateUserEndpointParams = {
  firstName?: string;
  lastName?: string;
  email?: string;
};
export type UpdateUserEndpointResult = {
  user: PublicUser;
};
export type AddWorkspaceEndpointParams = {
  name: string;
  rootname: string;
  description?: string;
};
export type WorkspaceBillStatus = 'ok' | 'gracePeriod' | 'billOverdue';
export type UsageThreshold = {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  budget: number;
};
export type WorkspaceUsageThresholds = {
  storage?: UsageThreshold;
  bin?: UsageThreshold;
  bout?: UsageThreshold;
  total?: UsageThreshold;
};
export type UsageThresholdLock = {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  locked: boolean;
};
export type WorkspaceUsageThresholdLocks = {
  storage?: UsageThresholdLock;
  bin?: UsageThresholdLock;
  bout?: UsageThresholdLock;
  total?: UsageThresholdLock;
};
export type Workspace = {
  resourceId: string;
  workspaceId: string;
  providedResourceId?: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  name: string;
  rootname: string;
  description?: string;
  publicPermissionGroupId: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: WorkspaceUsageThresholds;
  usageThresholdLocks: WorkspaceUsageThresholdLocks;
};
export type AddWorkspaceEndpointSuccessResult = {
  workspace: Workspace;
};
export type DeleteWorkspaceEndpointParams = {
  workspaceId?: string;
};
export type GetUserWorkspacesEndpointParams = {
  page?: number;
  pageSize?: number;
};
export type GetUserWorkspacesEndpointResult = {
  page: number;
  workspaces: Array<Workspace>;
};
export type GetWorkspaceEndpointParams = {
  workspaceId?: string;
};
export type GetWorkspaceEndpointSuccessResult = {
  workspace: Workspace;
};
export type UpdateWorkspaceInput = {
  name?: string;
  description?: string;
};
export type UpdateWorkspaceEndpointParams = {
  workspaceId?: string;
  workspace: UpdateWorkspaceInput;
};
export type UpdateWorkspaceEndpointSuccessResult = {
  workspace: Workspace;
};

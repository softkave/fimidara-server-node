// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import type {Readable} from 'stream';

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
  providedResourceId?: string | null;
};
export type AddAgentTokenEndpointResult = {
  token: AgentToken;
};
export type DeleteAgentTokenEndpointParams = {
  tokenId?: string;
  onReferenced?: boolean;
  providedResourceId?: string;
  workspaceId?: string;
};
export type LongRunningJobResult = {
  jobId?: string;
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
export type UpdateAgentTokenEndpointResult = {
  token: AgentToken;
};
export type DeleteCollaborationRequestEndpointParams = {
  requestId: string;
};
export type GetUserCollaborationRequestEndpointParams = {
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
export type GetUserCollaborationRequestEndpointResult = {
  request: CollaborationRequestForUser;
};
export type GetUserCollaborationRequestsEndpointParams = {
  page?: number;
  pageSize?: number;
};
export type GetUserCollaborationRequestsEndpointResult = {
  requests: Array<CollaborationRequestForUser>;
  page: number;
};
export type GetWorkspaceCollaborationRequestEndpointParams = {
  requestId: string;
  workspaceId?: string;
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
  providedResourceId?: string | null;
};
export type GetWorkspaceCollaborationRequestEndpointResult = {
  request: CollaborationRequestForWorkspace;
};
export type GetWorkspaceCollaborationRequestsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspaceCollaborationRequestsEndpointResult = {
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
export type RespondToCollaborationRequestEndpointResult = {
  request: CollaborationRequestForUser;
};
export type RevokeCollaborationRequestEndpointParams = {
  requestId: string;
};
export type RevokeCollaborationRequestEndpointResult = {
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
export type SendCollaborationRequestEndpointResult = {
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
export type UpdateCollaborationRequestEndpointResult = {
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
  createdAt: number;
  lastUpdatedAt: number;
};
export type GetCollaboratorEndpointResult = {
  collaborator: Collaborator;
};
export type GetWorkspaceCollaboratorsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspaceCollaboratorsEndpointResult = {
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
  extension?: string;
  resourceId: string;
  workspaceId: string;
  parentId: string | null;
  idPath: Array<string>;
  namepath: Array<string>;
  mimetype?: string;
  encoding?: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  name: string;
  description?: string;
  providedResourceId?: string | null;
};
export type GetFileDetailsEndpointResult = {
  file: File;
};
export type ImageResizeFitEnum =
  | 'contain'
  | 'cover'
  | 'fill'
  | 'inside'
  | 'outside';
export type ImageResizePositionEnum =
  | 'top'
  | 'right top'
  | 'right'
  | 'right bottom'
  | 'bottom'
  | 'left bottom'
  | 'left'
  | 'left top'
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'
  | 'centre'
  | 'entropy'
  | 'attention';
export type ImageResizeParams = {
  width?: number;
  height?: number;
  fit?: ImageResizeFitEnum;
  position?: ImageResizePositionEnum | number;
  background?: string;
  withoutEnlargement?: boolean;
};
export type ImageFormatEnum = 'jpeg' | 'png' | 'webp' | 'tiff' | 'raw';
export type ReadFileEndpointParams = {
  filepath?: string;
  fileId?: string;
  imageResize?: ImageResizeParams;
  imageFormat?: ImageFormatEnum;
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
export type UpdateFileDetailsEndpointResult = {
  file: File;
};
export type IssuePresignedPathEndpointParams = {
  filepath?: string;
  fileId?: string;
  duration?: number;
  expires?: number;
  usageCount?: number;
};
export type IssuePresignedPathEndpointResult = {
  path: string;
};
export type FileMatcher = {
  filepath?: string;
  fileId?: string;
};
export type GetPresignedPathsForFilesEndpointParams = {
  files?: Array<FileMatcher>;
  workspaceId?: string;
};
export type GetPresignedPathsForFilesItem = {
  path: string;
  filepath: string;
};
export type GetPresignedPathsForFilesEndpointResult = {
  paths: Array<GetPresignedPathsForFilesItem>;
};
export type UploadFileEndpointParams = {
  filepath?: string;
  fileId?: string;
  data: string | Readable | Blob;
  description?: string;
  encoding?: string;
  mimetype?: string;
  size: number;
};
export type UploadFileEndpointResult = {
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
  namepath: Array<string>;
  parentId: string | null;
  providedResourceId?: string | null;
};
export type AddFolderEndpointResult = {
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
export type GetFolderEndpointResult = {
  folder: Folder;
};
export type ListFolderContentEndpointParams = {
  folderpath?: string;
  folderId?: string;
  contentType?: 'file' | 'folder';
  page?: number;
  pageSize?: number;
};
export type ListFolderContentEndpointResult = {
  folders: Array<Folder>;
  files: Array<File>;
  page: number;
};
export type CountFolderContentEndpointParams = {
  folderpath?: string;
  folderId?: string;
  contentType?: 'file' | 'folder';
};
export type CountFolderContentEndpointResult = {
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
export type UpdateFolderEndpointResult = {
  folder: Folder;
};
export type GetJobStatusEndpointParams = {
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
  providedResourceId?: string | null;
};
export type AddPermissionGroupEndpointResult = {
  permissionGroup: PermissionGroup;
};
export type AssignPermissionGroupInput = {
  permissionGroupId: string;
};
export type AssignPermissionGroupsEndpointParams = {
  workspaceId?: string;
  entityId: string | Array<string>;
  permissionGroups: Array<AssignPermissionGroupInput>;
};
export type UnassignPermissionGroupsEndpointParams = {
  workspaceId?: string;
  entityId: string | Array<string>;
  permissionGroups: string | Array<string>;
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
export type GetPermissionGroupEndpointResult = {
  permissionGroup: PermissionGroup;
};
export type GetEntityAssignedPermissionGroupsParams = {
  workspaceId?: string;
  entityId: string;
  includeInheritedPermissionGroups?: boolean;
};
export type PublicAssignedPermissionGroupMeta = {
  permissionGroupId: string;
  assignedBy: Agent;
  assignedAt: number;
  assigneeEntityId: string;
};
export type GetEntityAssignedPermissionGroupsEndpointResult = {
  permissionGroups: Array<PermissionGroup>;
  immediateAssignedPermissionGroupsMeta: Array<PublicAssignedPermissionGroupMeta>;
};
export type GetWorkspacePermissionGroupsEndpointParams = {
  workspaceId?: string;
  page?: number;
  pageSize?: number;
};
export type GetWorkspacePermissionGroupsEndpointResult = {
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
export type UpdatePermissionGroupEndpointResult = {
  permissionGroup: PermissionGroup;
};
export type PermissionItemInputTarget = {
  targetId?: string | Array<string>;
  filepath?: string | Array<string>;
  folderpath?: string | Array<string>;
  workspaceRootname?: string;
};
export type AppActionType =
  | 'wildcard'
  | 'updateWorkspace'
  | 'deleteWorkspace'
  | 'readWorkspace'
  | 'addFolder'
  | 'readFolder'
  | 'updateFolder'
  | 'transferFolder'
  | 'deleteFolder'
  | 'addFile'
  | 'readFile'
  | 'updateFile'
  | 'transferFile'
  | 'deleteFile'
  | 'addCollaborator'
  | 'readCollaborator'
  | 'removeCollaborator'
  | 'readCollaborationRequest'
  | 'revokeCollaborationRequest'
  | 'updateCollaborationRequest'
  | 'updatePermission'
  | 'readPermission'
  | 'addAgentToken'
  | 'readAgentToken'
  | 'updateAgentToken'
  | 'deleteAgentToken'
  | 'addTag'
  | 'readTag'
  | 'updateTag'
  | 'deleteTag'
  | 'assignTag'
  | 'readUsageRecord';
export type PermissionItemInput = {
  target: Array<PermissionItemInputTarget> | PermissionItemInputTarget;
  access: boolean;
  entityId: string | Array<string>;
  action: AppActionType | Array<AppActionType>;
};
export type AddPermissionItemsEndpointParams = {
  workspaceId?: string;
  items: Array<PermissionItemInput>;
};
export type DeleteDeletePermissionItemInputTarget = {
  targetId?: string | Array<string>;
  filepath?: string | Array<string>;
  folderpath?: string | Array<string>;
  workspaceRootname?: string;
};
export type DeletePermissionItemInput = {
  target:
    | Array<DeleteDeletePermissionItemInputTarget>
    | DeleteDeletePermissionItemInputTarget;
  action?: AppActionType | Array<AppActionType>;
  access?: boolean;
  entityId?: string | Array<string>;
};
export type DeletePermissionItemsEndpointParams = {
  workspaceId?: string;
  items?: Array<DeletePermissionItemInput>;
};
export type ResolveEntityPermissionItemInputTarget = {
  targetId?: string | Array<string>;
  filepath?: string | Array<string>;
  folderpath?: string | Array<string>;
  workspaceRootname?: string;
};
export type ResolveEntityPermissionItemInput = {
  target:
    | Array<ResolveEntityPermissionItemInputTarget>
    | ResolveEntityPermissionItemInputTarget;
  entityId: string | Array<string>;
  action: AppActionType | Array<AppActionType>;
};
export type ResolveEntityPermissionsEndpointParams = {
  workspaceId?: string;
  items: Array<ResolveEntityPermissionItemInput>;
};
export type ResolvedEntityPermissionItemTarget = {
  targetId?: string;
  filepath?: string;
  folderpath?: string;
  workspaceRootname?: string;
};
export type ResolvedEntityPermissionItem = {
  target: ResolvedEntityPermissionItemTarget;
  entityId: string;
  action: AppActionType;
  hasAccess: boolean;
  permittingEntityId?: string;
  permittingTargetId?: string;
};
export type ResolveEntityPermissionsEndpointResult = {
  items: Array<ResolvedEntityPermissionItem>;
};
export type FetchResourceItem = {
  resourceId?: string | Array<string>;
  action: AppActionType;
  filepath?: string | Array<string>;
  folderpath?: string | Array<string>;
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
export type UsageRecordCategory = 'total' | 'storage' | 'bin' | 'bout';
export type UsageRecordFulfillmentStatus =
  | 'undecided'
  | 'fulfilled'
  | 'dropped';
export type SummedUsageQuery = {
  category?: UsageRecordCategory | Array<UsageRecordCategory>;
  fromDate?: number;
  toDate?: number;
  fulfillmentStatus?:
    | UsageRecordFulfillmentStatus
    | Array<UsageRecordFulfillmentStatus>;
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
  providedResourceId?: string | null;
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
export type User = {
  resourceId: string;
  createdAt: number;
  lastUpdatedAt: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordLastChangedAt: number;
  requiresPasswordChange?: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
  workspaces: Array<UserWorkspace>;
  isOnWaitlist: boolean;
};
export type LoginResult = {
  user: User;
  token: string;
  clientAssignedToken: string;
};
export type UpdateUserEndpointParams = {
  firstName?: string;
  lastName?: string;
  email?: string;
};
export type UpdateUserEndpointResult = {
  user: User;
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
  providedResourceId?: string | null;
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
export type AddWorkspaceEndpointResult = {
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
export type GetWorkspaceEndpointResult = {
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
export type UpdateWorkspaceEndpointResult = {
  workspace: Workspace;
};

// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

export type GetUserCollaborationRequestEndpointParams = {
  requestId: string;
};
export type AgentType = 'user' | 'agentToken';
export type Agent = {
  agentId: string;
  agentType: AgentType;
};
export type CollaborationRequestStatusType =
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'pending';
export type CollaborationRequestForUser = {
  resourceId: string;
  createdBy?: Agent;
  createdAt: number;
  lastUpdatedBy?: Agent;
  lastUpdatedAt: number;
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: Agent;
  recipientEmail: string;
  message: string;
  expiresAt?: number;
  workspaceName: string;
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
export type CountItemsResult = {
  count: number;
};
export type CollaborationRequestResponseType = 'accepted' | 'declined';
export type RespondToCollaborationRequestEndpointParams = {
  requestId: string;
  response: CollaborationRequestResponseType;
};
export type RespondToCollaborationRequestEndpointResult = {
  request: CollaborationRequestForUser;
};
export type GetCollaboratorsWithoutPermissionEndpointParams = {
  workspaceId?: string;
};
export type GetCollaboratorsWithoutPermissionEndpointResult = {
  collaboratorIds: Array<string>;
};
export type PublicWorkspaceResource = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: Agent;
  workspaceId: string;
};
export type User = {
  resourceId: string;
  createdBy?: Agent;
  createdAt: number;
  lastUpdatedBy?: Agent;
  lastUpdatedAt: number;
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: Agent;
  firstName: string;
  lastName: string;
  email: string;
  passwordLastChangedAt: number;
  requiresPasswordChange?: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
  workspaces: Array<PublicWorkspaceResource>;
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
export type ChangePasswordWithCurrentPasswordEndpointParams = {
  currentPassword: string;
  password: string;
};
export type ChangePasswordWithTokenEndpointParams = {
  password: string;
};
export type ForgotPasswordEndpointParams = {
  email: string;
};
export type LoginParams = {
  email: string;
  password: string;
};
export type SignupEndpointParams = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type UserExistsEndpointParams = {
  email: string;
};
export type UserExistsEndpointResult = {
  exists: boolean;
};
export type AddWorkspaceEndpointParams = {
  name: string;
  rootname: string;
  description?: string;
};
export type WorkspaceBillStatus = 'ok' | 'gracePeriod' | 'billOverdue';
export type UsageRecordCategory =
  | 'total'
  | 'storage'
  | 'storageEver'
  | 'bin'
  | 'bout';
export type UsageThreshold = {
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  category: UsageRecordCategory;
  budget: number;
  usage: number;
};
export type WorkspaceUsageThresholds = {
  storage?: UsageThreshold;
  storageEver?: UsageThreshold;
  bin?: UsageThreshold;
  bout?: UsageThreshold;
  total?: UsageThreshold;
};
export type Workspace = {
  resourceId: string;
  createdBy: Agent;
  createdAt: number;
  lastUpdatedBy: Agent;
  lastUpdatedAt: number;
  isDeleted: boolean;
  deletedAt?: number;
  deletedBy?: Agent;
  workspaceId: string;
  name: string;
  rootname: string;
  description?: string;
  publicPermissionGroupId: string;
  billStatusAssignedAt: number;
  billStatus: WorkspaceBillStatus;
  usageThresholds: WorkspaceUsageThresholds;
};
export type AddWorkspaceEndpointResult = {
  workspace: Workspace;
};
export type GetUserWorkspacesEndpointParams = {
  page?: number;
  pageSize?: number;
};
export type GetUserWorkspacesEndpointResult = {
  page: number;
  workspaces: Array<Workspace>;
};
export type GetWaitlistedUsersEndpointParams = {};
export type GetWaitlistedUsersEndpointResult = {
  users: Array<User>;
};
export type UpgradeWaitlistedUsersEndpointParams = {
  userIds: Array<string>;
};
export type GetUsersEndpointParams = {};
export type GetUsersEndpointResult = {
  users: Array<User>;
};
export type GetWorkspacesEndpointParams = {};
export type GetWorkspacesEndpointResult = {
  workspaceList: Array<Workspace>;
};

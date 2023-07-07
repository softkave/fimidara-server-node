// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

export type ChangePasswordWithCurrentPasswordEndpointParams = {
  currentPassword: string;
  password: string;
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
  emailVerifiedAt?: number;
  emailVerificationEmailSentAt?: number;
  workspaces: Array<UserWorkspace>;
  isOnWaitlist: boolean;
};
export type LoginResult = {
  user: User;
  token: string;
  clientAssignedToken: string;
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
export type GetCollaboratorsWithoutPermissionEndpointParams = {
  workspaceId?: string;
};
export type GetCollaboratorsWithoutPermissionEndpointResult = {
  collaboratorIds: Array<string>;
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
export type AgentType = 'user' | 'agentToken';
export type Agent = {
  agentId: string;
  agentType: AgentType;
};
export type WorkspaceBillStatus = 'ok' | 'gracePeriod' | 'billOverdue';
export type UsageRecordCategory = 'storage' | 'bin' | 'bout' | 'total';
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
export type GetWorkspacesEndpointResult = {
  workspaceList: Array<Workspace>;
};

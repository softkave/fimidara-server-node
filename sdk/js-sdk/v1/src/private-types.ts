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

import {IAssignedPermissionGroup} from './permissionGroups';

export interface IUserWorkspace {
  workspaceId: string;
  joinedAt: Date | string;
  permissionGroups: IAssignedPermissionGroup[];
}

export interface IUser {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  createdAt: Date | string;
  lastUpdatedAt: Date | string;
  passwordLastChangedAt: Date | string;

  // email verification
  isEmailVerified: boolean;
  emailVerifiedAt?: Date | string | null;
  emailVerificationEmailSentAt?: Date | string | null;
}

export interface IUserWithWorkspace extends IUser {
  workspaces: IUserWorkspace[];
}

export interface IPublicUserData {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastUpdatedAt: string;
  passwordLastChangedAt: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationEmailSentAt?: string | null;
  workspaces: IUserWorkspace[];
}

export interface IPublicCollaborator extends IUserWorkspace {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
}

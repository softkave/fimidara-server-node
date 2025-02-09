import {
  PublicResource,
  PublicWorkspaceResource,
  Resource,
  WorkspaceResource,
} from './system.js';

export interface User extends Resource {
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  passwordLastChangedAt?: number;
  requiresPasswordChange?: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
  isOnWaitlist: boolean;
  removedFromWaitlistOn?: number;
  oauthUserId?: string | null;
}

export interface UserWithWorkspace extends User {
  workspaces: WorkspaceResource[];
}

export type PublicUser = PublicResource &
  Pick<
    User,
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'passwordLastChangedAt'
    | 'requiresPasswordChange'
    | 'isEmailVerified'
    | 'emailVerifiedAt'
    | 'emailVerificationEmailSentAt'
    | 'isOnWaitlist'
  > & {workspaces: PublicWorkspaceResource[]};

export type PublicCollaborator = PublicResource &
  PublicWorkspaceResource &
  Pick<User, 'firstName' | 'lastName' | 'email' | 'resourceId'>;

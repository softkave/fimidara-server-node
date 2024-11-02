import {PublicWorkspaceResource, WorkspaceResource} from './system.js';

export interface IRootLevelUserData {
  isOnWaitlist: boolean;
  removedFromWaitlistOn?: number;
}

export interface User extends WorkspaceResource {
  firstName?: string;
  lastName?: string;
  email?: string;
  hash?: string;
  passwordLastChangedAt?: number;
  requiresPasswordChange?: boolean;
  isEmailVerified?: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
}

export type PublicUser = PublicWorkspaceResource &
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
  >;

export type PublicCollaborator = PublicWorkspaceResource &
  Pick<User, 'firstName' | 'lastName' | 'email' | 'resourceId'>;

import {PublicResource, Resource} from './system';

export interface UserWorkspace {
  workspaceId: string;
  joinedAt: number;
}

export interface User extends Resource {
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  passwordLastChangedAt: number;
  requiresPasswordChange?: boolean;
  isEmailVerified: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
  isOnWaitlist: boolean;
  removedFromWaitlistOn?: number;
}

export interface UserWithWorkspace extends User {
  workspaces: UserWorkspace[];
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
  > & {workspaces: UserWorkspace[]};

export type PublicCollaborator = PublicResource &
  UserWorkspace &
  Pick<User, 'firstName' | 'lastName' | 'email' | 'resourceId'>;

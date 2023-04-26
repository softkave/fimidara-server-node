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
  > & {workspaces: UserWorkspace[]};

export type PublicCollaborator = UserWorkspace &
  Pick<User, 'firstName' | 'lastName' | 'email' | 'resourceId'>;

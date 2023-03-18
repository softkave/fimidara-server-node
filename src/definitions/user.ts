import {IPublicResource, IResource} from './system';

export interface IUserWorkspace {
  workspaceId: string;
  joinedAt: number;
}

export interface IUser extends IResource {
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  passwordLastChangedAt: number;
  isEmailVerified: boolean;
  emailVerifiedAt?: number | null;
  emailVerificationEmailSentAt?: number | null;
}

export interface IUserWithWorkspace extends IUser {
  workspaces: IUserWorkspace[];
}

export type IPublicUserData = IPublicResource &
  Pick<
    IUser,
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'passwordLastChangedAt'
    | 'isEmailVerified'
    | 'emailVerifiedAt'
    | 'emailVerificationEmailSentAt'
  > & {workspaces: IUserWorkspace[]};

export type IPublicCollaborator = IUserWorkspace &
  Pick<IUser, 'firstName' | 'lastName' | 'email' | 'resourceId'>;

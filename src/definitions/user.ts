import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';

export interface IUserOrganization {
  organizationId: string;
  joinedAt: Date | string;
  presets: IAssignedPresetPermissionsGroup[];
}

export interface IUser {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  createdAt: Date | string;
  lastUpdatedAt?: Date | string;
  passwordLastChangedAt: Date | string;

  // email verification
  isEmailVerified: boolean;
  emailVerifiedAt?: Date | string | null;
  emailVerificationEmailSentAt?: Date | string | null;
}

export interface IUserWithOrganization extends IUser {
  organizations: IUserOrganization[];
}

export interface IPublicUserData {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastUpdatedAt?: string;
  passwordLastChangedAt: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationEmailSentAt?: string | null;
  organizations: IUserOrganization[];
}

export interface IPublicCollaborator extends IUserOrganization {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
}

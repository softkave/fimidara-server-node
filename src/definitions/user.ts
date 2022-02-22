import {IAssignedPresetPermissionsGroup} from './presetPermissionsGroup';

export interface IUserOrganization {
  organizationId: string;
  joinedAt: string;
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

  organizations: IUserOrganization[];
}

import {IUserOrganization} from '../../definitions/user';

export interface IPublicUserData {
  resourceId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastUpdatedAt?: string;
  passwordLastChangedAt: string;

  // email verification
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationEmailSentAt?: string | null;

  organizations: IUserOrganization[];
}

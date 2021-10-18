export interface IUserOrganization {
  organizationId: string;
  joinedAt: string;
  roles: string[];
}

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  hash: string;
  createdAt: string;
  lastUpdatedAt?: string;
  passwordLastChangedAt: string;

  // email verification
  isEmailVerified: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationEmailSentAt?: string | null;

  organizations: IUserOrganization[];
}

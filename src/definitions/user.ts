export interface IUserOrganization {
    organizationId: string;
    joinedAt: string;
}

export interface IUser {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    hash: string;
    createdAt: string;
    lastUpdatedAt?: string;
    passwordLastChangedAt: string;

    // email verification
    isEmailVerified: boolean;
    emailVerifiedAt?: string | null;
    emailVerificationCode?: string | null;
    emailVerificationCodeSentAt?: string | null;

    // phone verification
    isPhoneVerified?: boolean;
    phoneVerifiedAt?: string | null;
    phoneVerificationSID?: string | null;
    phoneVerificationCodeSentAt?: string | null;

    orgs: IUserOrganization[];
}

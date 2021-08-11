export interface IPublicUserData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
    lastUpdatedAt?: string;
    isEmailVerified: boolean;
    emailVerifiedAt?: string | null;
}

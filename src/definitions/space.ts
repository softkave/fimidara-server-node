export interface ISpace {
    spaceId: string;
    organizationId: string;
    environmentId: string;
    createdBy: string;
    createdAt: string;
    lastUpdatedBy?: string;
    lastUpdatedAt?: string;
    name: string;
    description?: string;
}

export interface IPublicEnvironment {
  resourceId: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

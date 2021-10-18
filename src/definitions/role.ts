export interface IUserRole {
  roleId: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

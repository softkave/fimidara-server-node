import {IAgent} from './system';

export interface IUserRole {
  resourceId: string;
  organizationId: string;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

export interface IAssignedUserRole {
  roleId: string;
  assignedAt: string;
  assignedBy: IAgent;
  order: number;
}

import {IAgent} from './system';

export interface IOrganization {
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

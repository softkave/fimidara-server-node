import {IAgent} from '../../definitions/system';

export interface IPublicOrganization {
  organizationId: string;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

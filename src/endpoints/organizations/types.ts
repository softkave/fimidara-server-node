import {IAgent} from '../../definitions/system';

export interface IPublicOrganization {
  organizationId: string;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

import {IAgent} from '../../definitions/system';

export interface IPublicOrganization {
  resourceId: string;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

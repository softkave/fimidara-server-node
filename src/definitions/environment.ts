import {IAgent} from './system';

export interface IEnvironment {
  environmentId: string;
  organizationId: string;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

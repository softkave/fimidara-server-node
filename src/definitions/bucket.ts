import {IAgent} from './system';

export interface IBucket {
  bucketId: string;
  organizationId: string;
  environmentId: string;
  createdBy: IAgent;
  createdAt: string;
  maxFileSize: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
}

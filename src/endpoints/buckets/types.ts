import {IAgent} from '../../definitions/system';

export interface IPublicBucket {
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

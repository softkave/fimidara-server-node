import {IAgent, IPublicAccessOp} from './system';

export interface IFolder {
  resourceId: string;
  organizationId: string;
  // bucketId: string;
  // environmentId: string;
  idPath: string[];
  namePath: string[];
  parentId?: string;
  createdBy: IAgent;
  createdAt: Date | string;
  maxFileSizeInBytes: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  name: string;
  description?: string;
  publicAccessOps: IPublicAccessOp[];
}

export interface IPublicFolder {
  resourceId: string;
  organizationId: string;
  idPath: string[];
  namePath: string[];
  parentId?: string;
  createdBy: IAgent;
  createdAt: Date | string;
  maxFileSizeInBytes: number;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  name: string;
  description?: string;
  publicAccessOps: IPublicAccessOp[];
}

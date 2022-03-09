import {IAgent, IPublicAccessOp} from './system';

export interface IFile {
  resourceId: string;
  organizationId: string;
  // environmentId: string;
  // bucketId: string;
  folderId?: string;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: Date | string;
  name: string;
  extension: string;
  description?: string;
  publicAccessOps: IPublicAccessOp[];

  // meta?: Record<string, string | number | boolean | null>;

  // TODO: look through other file platforms providers for features to implement
}

export type IPublicFile = IFile;

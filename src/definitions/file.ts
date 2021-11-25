import {IAgent} from './system';

export interface IFile {
  fileId: string;
  organizationId: string;
  environmentId: string;
  bucketId: string;
  folderId?: string;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  createdBy: IAgent;
  createdAt: string;
  lastUpdatedBy?: IAgent;
  lastUpdatedAt?: string;
  name: string;
  description?: string;
  // meta?: Record<string, string | number | boolean | null>;

  // TODO: look through other file platforms providers for features to implement
}

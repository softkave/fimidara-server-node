import {IAgent} from './system';

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

  // TODO: add which op is public
  isPublic?: boolean;
  markedPublicAt?: Date | string; // ISO date string
  markedPublicBy?: IAgent;

  // meta?: Record<string, string | number | boolean | null>;

  // TODO: look through other file platforms providers for features to implement
}

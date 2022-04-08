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

  // meta?: Record<string, string | number | boolean | null>;
}

export type IPublicFile = IFile;

export interface IFileMatcher {
  filepath?: string;
  fileId?: string;
  organizationId?: string;
}

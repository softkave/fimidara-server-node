import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IFile {
  resourceId: string;
  workspaceId: string;
  folderId?: string;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  createdBy: IAgent;
  createdAt: Date | string;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  name: string;
  extension: string;
  description?: string;

  // environmentId: string;
  // bucketId: string;
  // meta?: Record<string, string | number | boolean | null>;
}

export type IPublicFile = IFile & {tags: IAssignedTag[]};

export type IFileMatcher = {
  // file path with workspace root name
  filepath?: string;
  fileId?: string;
};

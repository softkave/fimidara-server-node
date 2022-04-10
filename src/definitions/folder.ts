import {IAgent} from './system';
import {IAssignedTag} from './tag';

export interface IFolder {
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

  // bucketId: string;
  // environmentId: string;
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
  tags: IAssignedTag[];
}

export interface IFolderMatcher {
  folderpath?: string;
  folderId?: string;
  organizationId?: string;
}

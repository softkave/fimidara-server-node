import {IAgent} from './system';

export interface IFolder {
  resourceId: string;
  workspaceId: string;
  idPath: string[];
  namePath: string[];
  parentId?: string | null;
  createdBy: IAgent;
  createdAt: Date | string;
  // maxFileSizeInBytes: number;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: Date | string;
  name: string;
  description?: string;

  // bucketId: string;
  // environmentId: string;
}

export interface IPublicFolder {
  resourceId: string;
  workspaceId: string;
  idPath: string[];
  namePath: string[];
  parentId?: string;
  createdBy: IAgent;
  createdAt: Date | string;
  // maxFileSizeInBytes: number;
  lastUpdatedBy: IAgent;
  lastUpdatedAt: string;
  name: string;
  description?: string;
  // tags: IAssignedTag[];
}

export interface IFolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

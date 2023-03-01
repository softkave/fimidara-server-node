import {IWorkspaceResourceBase} from './system';

export interface IFolder extends IWorkspaceResourceBase {
  idPath: string[];
  namePath: string[];
  parentId?: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
}

export type IPublicFolder = IFolder;

export interface IFolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

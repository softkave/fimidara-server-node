import {ConvertAgentToPublicAgent, IWorkspaceResource} from './system';

export interface IFolder extends IWorkspaceResource {
  idPath: string[];
  namePath: string[];
  parentId: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
}

export type IPublicFolder = ConvertAgentToPublicAgent<IFolder>;
export interface IFolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

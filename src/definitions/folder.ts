import {ConvertAgentToPublicAgent, WorkspaceResource} from './system';

export interface FolderMountEntry {
  mountId: string;
  key: string;
}

export interface Folder extends WorkspaceResource {
  idPath: string[];
  namepath: string[];
  parentId: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
  mountEntries: FolderMountEntry[];
}

export type PublicFolder = ConvertAgentToPublicAgent<
  Pick<Folder, 'parentId' | 'idPath' | 'namepath' | 'name' | 'description'>
>;
export interface FolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

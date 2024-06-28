import {
  PublicWorkspaceResource,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export interface Folder extends WorkspaceResource {
  idPath: string[];
  namepath: string[];
  parentId: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
}

export type PublicFolder = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<Folder, 'parentId' | 'idPath' | 'namepath' | 'name' | 'description'>
  >;

export interface FolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

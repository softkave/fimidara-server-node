import {ConvertAgentToPublicAgent, WorkspaceResource} from './system';

export interface FolderResolvedMountEntry {
  mountId: string;
  resolvedAt: number;
}

export interface Folder extends WorkspaceResource {
  idPath: string[];
  namepath: string[];
  parentId: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
  resolvedEntries: FolderResolvedMountEntry[];
}

export type PublicFolder = ConvertAgentToPublicAgent<
  Pick<
    Folder,
    'parentId' | 'idPath' | 'namepath' | 'name' | 'description' | 'resolvedEntries'
  >
>;
export interface FolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

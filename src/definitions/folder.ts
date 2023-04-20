import { ConvertAgentToPublicAgent, WorkspaceResource } from './system';

export interface Folder extends WorkspaceResource {
  idPath: string[];
  namePath: string[];
  parentId: string | null;
  // maxFileSizeInBytes: number;
  name: string;
  description?: string;
}

export type PublicFolder = ConvertAgentToPublicAgent<Folder>;
export interface FolderMatcher {
  /**
   * Folder path with workspace rootname, e.g /workspace-rootname/folder-name
   **/
  folderpath?: string;
  folderId?: string;
}

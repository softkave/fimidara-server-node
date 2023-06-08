import {AppActionType, ConvertAgentToPublicAgent, WorkspaceResource} from './system';

export interface File extends WorkspaceResource {
  parentId: string | null;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  name: string;
  extension?: string;
  description?: string;
}

export type PublicFile = ConvertAgentToPublicAgent<File>;
export type FileMatcher = {
  // file path with workspace root name
  filepath?: string;
  fileId?: string;
};

export interface FilePresignedPath extends WorkspaceResource {
  /** File name path instead of ID because at the time of creation, the file may
   * not exist yet. */
  fileNamePath: string[];
  fileExtension?: string;
  agentTokenId: string;
  usageCount?: number;
  spentUsageCount: number;
  expiresAt?: number;
  action: AppActionType[];

  // TODO: should we add description?
  // description?: string
}

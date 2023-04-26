import {ConvertAgentToPublicAgent, WorkspaceResource} from './system';

export interface File extends WorkspaceResource {
  parentId: string | null;
  idPath: string[];
  namePath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  name: string;
  extension: string;
  description?: string;
}

export type PublicFile = ConvertAgentToPublicAgent<File>;
export type FileMatcher = {
  // file path with workspace root name
  filepath?: string;
  fileId?: string;
};

import {
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export interface File extends WorkspaceResource {
  parentId: string | null;
  idPath: string[];
  namepath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  name: string;
  extension?: string;
  description?: string;
  isWriteAvailable?: boolean;
  isReadAvailable?: boolean;
  version: number;
}

export type PublicFile = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<
      File,
      | 'parentId'
      | 'idPath'
      | 'namepath'
      | 'mimetype'
      | 'encoding'
      | 'size'
      | 'name'
      | 'extension'
      | 'description'
      | 'version'
    >
  >;

export type FileMatcher = {
  /** file path with workspace rootname e.g rootname/folder/file.txt */
  filepath?: string;
  fileId?: string;
};

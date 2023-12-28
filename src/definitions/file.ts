import {PermissionAction} from './permissionItem';
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

export interface FilePresignedPath extends WorkspaceResource {
  /** File name path (without extension) instead of ID because at the time of
   * creation, the file may not exist yet. */
  namepath: string[];
  /** File ID if the file exists. */
  fileId?: string;
  extension?: string;
  issueAgentTokenId: string;
  maxUsageCount?: number;
  spentUsageCount: number;
  expiresAt?: number;
  actions: PermissionAction[];

  // TODO: should we add description?
  // description?: string
}

export type PublicFilePresignedPath = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<
      FilePresignedPath,
      | 'namepath'
      | 'fileId'
      | 'issueAgentTokenId'
      | 'maxUsageCount'
      | 'spentUsageCount'
      | 'actions'
      | 'extension'
    >
  >;

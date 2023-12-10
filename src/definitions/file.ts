import {ObjectValues} from '../utils/types';
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
  head?: string;
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
  /** File name path instead of ID because at the time of creation, the file may
   * not exist yet. */
  filepath: string[];
  fileId?: string;
  extension?: string;
  agentTokenId: string;
  usageCount?: number;
  spentUsageCount: number;
  expiresAt?: number;
  action: PermissionAction[];

  // TODO: should we add description?
  // description?: string
}

export const FilePersistenceProviderTypeMap = {
  Fs: 'fs',
} as const;

export type FilePersistenceProviderType = ObjectValues<
  typeof FilePersistenceProviderTypeMap
>;

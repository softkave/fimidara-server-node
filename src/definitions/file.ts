import {FilePersistenceUploadPartResult} from '../contexts/file/types.js';
import {
  PublicWorkspaceResource,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export interface File extends WorkspaceResource {
  parentId: string | null;
  idPath: string[];
  namepath: string[];
  mimetype?: string;
  encoding?: string;
  size: number;
  name: string;
  ext?: string;
  description?: string;
  isWriteAvailable?: boolean;
  isReadAvailable?: boolean;
  version: number;

  // multipart uploads
  internalMultipartId?: string | null;
  clientMultipartId?: string | null;
  /** timestamp in ms */
  multipartTimeout?: number | null;
}

export interface FilePart
  extends WorkspaceResource,
    FilePersistenceUploadPartResult {
  fileId: string;
  size: number;
}

export interface FileWithRuntimeData extends File {
  // server runtime only state, never stored in DB
  RUNTIME_ONLY_shouldCleanupMultipart?: boolean;
  RUNTIME_ONLY_internalMultipartId?: string | null;
}

export type PublicFile = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      File,
      | 'parentId'
      | 'idPath'
      | 'namepath'
      | 'mimetype'
      | 'encoding'
      | 'size'
      | 'name'
      | 'ext'
      | 'description'
      | 'version'
    >
  >;

export type FileMatcher = {
  /** file path with workspace rootname e.g rootname/folder/file.txt */
  filepath?: string;
  fileId?: string;
};

export type PublicPart = Pick<FilePart, 'part' | 'size'>;

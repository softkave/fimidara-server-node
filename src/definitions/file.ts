import {FileBackendType} from './fileBackend.js';
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
  multipartId?: string | null;
  /** timestamp in ms */
  multipartTimeout?: number | null;
}

export interface FileWithRuntimeData extends File {
  // server runtime only state, never stored in DB
  RUNTIME_ONLY_shouldCleanupMultipart?: boolean;
  RUNTIME_ONLY_shouldCleanupMultipartId?: string | null;
}

export interface FilePart extends WorkspaceResource {
  fileId: string;
  part: number;
  size: number;
  partId: string;
  multipartId: string;
  backend: FileBackendType;
  /** backend-specific raw data */
  raw: unknown;
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
      | 'multipartId'
      | 'multipartTimeout'
    >
  >;

export type PublicFilePart = ToPublicDefinitions<
  Pick<FilePart, 'part' | 'size' | 'partId'>
>;

export type FileMatcher = {
  /** file path with workspace rootname e.g rootname/folder/file.txt */
  filepath?: string;
  fileId?: string;
};

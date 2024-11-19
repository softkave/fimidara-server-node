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
  partLength?: number | null;
  uploadedParts?: number | null;
  uploadedSize?: number | null;
  internalMultipartId?: string | null;
  clientMultipartId?: string | null;
  multipartTimeout?: number | null;

  // server runtime only state, never stored in DB
  RUNTIME_ONLY_shouldCleanupMultipart?: boolean;
  RUNTIME_ONLY_internalMultipartId?: string | null;
  RUNTIME_ONLY_partLength?: number | null;
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

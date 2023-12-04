import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {FileBackendMount, FileBackendType} from '../../../definitions/fileBackend';
import {AppResourceTypeMap} from '../../../definitions/system';

export type FilePersistenceProviderFeature =
  | 'describeFile'
  | 'describeFolder'
  | 'describeFolderFiles'
  | 'describeFolderFolders'
  | 'uploadFile'
  | 'readFile'
  | 'deleteFiles'
  | 'deleteFolders';

export interface FilePersistenceUploadFileParams {
  workspaceId: string;
  filepath: string;
  body: Readable;
  mount: FileBackendMount;
  // contentLength?: number;
  // contentType?: string;
  // contentEncoding?: string;
}

export interface FilePersistenceGetFileParams {
  workspaceId: string;
  filepath: string;
  mount: FileBackendMount;
}

export interface FilePersistenceDescribeFolderParams {
  workspaceId: string;
  folderpath: string;
  mount: FileBackendMount;
}

export interface FilePersistenceDeleteFilesParams {
  workspaceId: string;
  filepaths: string[];
  mount: FileBackendMount;
}

export interface PersistedFile {
  body?: Readable;
  size?: number;
}

export type PersistedFileDescription = {
  type: typeof AppResourceTypeMap.File;
  filepath: string;
  size?: number;
  lastUpdatedAt?: number;
};

export type PersistedFolderDescription = {
  type: typeof AppResourceTypeMap.Folder;
  folderpath: string;
};

export interface FilePersistenceDescribeFolderFilesParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  /* page is backend-dependent */
  page: unknown;
  mount: FileBackendMount;
}

export interface FilePersistenceDescribeFolderFoldersParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  page: unknown;
  mount: FileBackendMount;
}

export interface FilePersistenceDeleteFoldersParams {
  workspaceId: string;
  folderpaths: string[];
  mount: FileBackendMount;
}

export interface FilePersistenceDescribeFolderFilesResult {
  files: PersistedFileDescription[];
  /* null if content is exhausted */
  nextPage?: unknown | null;
}

export interface FilePersistenceDescribeFolderFoldersResult {
  folders: PersistedFolderDescription[];
  /* null if content is exhausted */
  nextPage?: unknown | null;
}

export interface FilePersistenceProvider {
  supportsFeature: (feature: FilePersistenceProviderFeature) => boolean;
  uploadFile: (params: FilePersistenceUploadFileParams) => Promise<Partial<File>>;
  readFile: (params: FilePersistenceGetFileParams) => Promise<PersistedFile>;
  describeFile: (
    params: FilePersistenceGetFileParams
  ) => Promise<PersistedFileDescription | undefined>;
  describeFolder: (
    params: FilePersistenceDescribeFolderParams
  ) => Promise<PersistedFolderDescription | undefined>;
  describeFolderFiles: (
    params: FilePersistenceDescribeFolderFilesParams
  ) => Promise<FilePersistenceDescribeFolderFilesResult>;
  describeFolderFolders: (
    params: FilePersistenceDescribeFolderFoldersParams
  ) => Promise<FilePersistenceDescribeFolderFoldersResult>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  deleteFolders: (params: FilePersistenceDeleteFoldersParams) => Promise<void>;
  close: () => Promise<void>;
}

export type FileProviderResolver = (
  type: FileBackendType,
  initParams: unknown
) => FilePersistenceProvider;

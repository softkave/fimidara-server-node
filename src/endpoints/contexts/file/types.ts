import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {FileBackendConfig, FileBackendMount} from '../../../definitions/fileBackend';
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
  mimetype?: string;
  encoding?: string;
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
  mimetype?: string;
  encoding?: string;
  mountId: string;
};

export type PersistedFolderDescription = {
  type: typeof AppResourceTypeMap.Folder;
  folderpath: string;
  mountId: string;
};

export interface FilePersistenceDescribeFolderFilesParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
  mount: FileBackendMount;
}

export interface FilePersistenceDescribeFolderFoldersParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
  mount: FileBackendMount;
}

export interface FilePersistenceDeleteFoldersParams {
  workspaceId: string;
  folderpaths: string[];
  mount: FileBackendMount;
}

export interface FilePersistenceDescribeFolderFilesResult {
  files: PersistedFileDescription[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FilePersistenceDescribeFolderFoldersResult {
  folders: PersistedFolderDescription[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FilePersistenceAddFolderParams {
  workspaceId: string;
  folderpath: string;
  mount: FileBackendMount;
}

export interface FilePersistenceAddFolderResult {
  folder?: PersistedFolderDescription;
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
  mount: FileBackendMount,
  initParams: unknown,
  config: FileBackendConfig
) => FilePersistenceProvider;

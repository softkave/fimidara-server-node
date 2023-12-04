import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {FileBackendMount} from '../../../definitions/fileBackend';
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

interface DescribeFolderFilesParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  /* page is backend-dependent */
  page: unknown;
  mount: FileBackendMount;
}

interface DescribeFolderFoldersParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  page: unknown;
  mount: FileBackendMount;
}

interface DeleteFoldersParams {
  workspaceId: string;
  folderpaths: string[];
  mount: FileBackendMount;
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
  describeFolderFiles: (params: DescribeFolderFilesParams) => Promise<{
    files: PersistedFileDescription[];
    /* null if content is exhausted */
    page?: unknown | null;
  }>;
  describeFolderFolders: (params: DescribeFolderFoldersParams) => Promise<{
    folders: PersistedFolderDescription[];
    /* null if content is exhausted */
    page?: unknown | null;
  }>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  deleteFolders: (params: DeleteFoldersParams) => Promise<void>;
  close: () => Promise<void>;
}

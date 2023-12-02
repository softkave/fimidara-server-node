import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {AppResourceTypeMap} from '../../../definitions/system';

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

export interface FilePersistenceProviderDescribeFolderChildrenParams {
  workspaceId: string;
  folderpath: string;
  max: number;
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous describeFolderChildren calls */
  page: unknown;
  mount: FileBackendMount;
}

export interface FilePersistenceProviderDescribeFolderChildrenResult {
  files: PersistedFileDescription[];
  folders: PersistedFolderDescription[];
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous describeFolderChildren calls */
  page?: unknown | null;
}

export interface FilePersistenceProvider {
  uploadFile: (params: FilePersistenceUploadFileParams) => Promise<Partial<File>>;
  readFile: (params: FilePersistenceGetFileParams) => Promise<PersistedFile>;
  describeFile: (
    params: FilePersistenceGetFileParams
  ) => Promise<PersistedFileDescription | undefined>;
  describeFolder: (
    params: FilePersistenceDescribeFolderParams
  ) => Promise<PersistedFolderDescription | undefined>;
  describeFolderChildren: (
    params: FilePersistenceProviderDescribeFolderChildrenParams
  ) => Promise<FilePersistenceProviderDescribeFolderChildrenResult>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  close: () => Promise<void>;
}

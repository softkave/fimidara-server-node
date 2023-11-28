import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {AppResourceTypeMap} from '../../../definitions/system';

export interface FilePersistenceUploadFileParams {
  key: string;
  body: Readable;
  // contentLength?: number;
  // contentType?: string;
  // contentEncoding?: string;
}

export interface FilePersistenceGetFileParams {
  key: string;
}

export interface FilePersistenceDeleteFilesParams {
  keys: string[];
}

export interface PersistedFile {
  body?: Readable;
  contentLength?: number;
}

export type PersistedFileDescription = {
  type: typeof AppResourceTypeMap.File;
  name: string;
  size?: number;
  lastUpdatedAt?: number;
};

export type PersistedFolderDescription = {
  type: typeof AppResourceTypeMap.Folder;
  name: string;
};

export type PersistedEntityDescription =
  | PersistedFileDescription
  | PersistedFolderDescription;

export interface FilePersistenceProviderDescribeFolderChildrenParams {
  key: string;
  max?: number;
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous describeFolderChildren calls */
  page?: unknown;
}

export interface FilePersistenceProviderDescribeFolderChildrenResult {
  children: PersistedEntityDescription[];
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous describeFolderChildren calls */
  page?: unknown | null;
}

export interface FilePersistenceProvider {
  uploadFile: (params: FilePersistenceUploadFileParams) => Promise<Partial<File>>;
  getFile: (params: FilePersistenceGetFileParams) => Promise<PersistedFile>;
  describeFile: (
    params: FilePersistenceGetFileParams
  ) => Promise<PersistedFileDescription>;
  describeFolder: (
    params: FilePersistenceGetFileParams
  ) => Promise<PersistedFolderDescription>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  describeFolderChildren: (
    params: FilePersistenceProviderDescribeFolderChildrenParams
  ) => Promise<FilePersistenceProviderDescribeFolderChildrenResult>;
  normalizeFile: (workspaceId: string, file: PersistedFileDescription) => File;
  normalizeFolder: (workspaceId: string, folder: PersistedFolderDescription) => Folder;
  close: () => Promise<void>;
}

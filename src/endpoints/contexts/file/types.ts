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

export type PersistedFileDescription =
  | {
      type: typeof AppResourceTypeMap.Folder;
      name: string;
    }
  | {
      type: typeof AppResourceTypeMap.File;
      name: string;
      size?: number;
      lastUpdatedAt?: number;
    };

export interface FilePersistenceProviderListFolderChildrenParams {
  key: string;
  max?: number;
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous listFolderChildren calls */
  page?: unknown;
}

export interface FilePersistenceProviderListFolderChildrenResult {
  children: PersistedFileDescription[];
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous listFolderChildren calls */
  page?: unknown | null;
}

export interface FilePersistenceProvider {
  uploadFile: (params: FilePersistenceUploadFileParams) => Promise<void>;
  getFile: (params: FilePersistenceGetFileParams) => Promise<PersistedFile>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  listFolderChildren: (
    params: FilePersistenceProviderListFolderChildrenParams
  ) => Promise<FilePersistenceProviderListFolderChildrenResult>;
  /** Throws error if `file.type !== "file"` */
  normalizeFile: (file: PersistedFileDescription) => File;
  /** Throws error if `folder.type !== "folder"` */
  normalizeFolder: (folder: PersistedFileDescription) => Folder;
  close: () => Promise<void>;
}

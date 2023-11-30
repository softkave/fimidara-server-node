import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {Agent, AppResourceTypeMap} from '../../../definitions/system';
import {Omit1} from '../../../utils/types';

export interface FilePersistenceUploadFileParams {
  workspaceId: string;
  filepath: string;
  body: Readable;
  // contentLength?: number;
  // contentType?: string;
  // contentEncoding?: string;
}

export interface FilePersistenceGetFileParams {
  workspaceId: string;
  filepath: string;
}

export interface FilePersistenceDescribeFolderParams {
  workspaceId: string;
  folderpath: string;
}

export interface FilePersistenceDeleteFilesParams {
  workspaceId: string;
  filepaths: string[];
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
}

export interface FilePersistenceProviderDescribeFolderChildrenResult {
  files: PersistedFileDescription[];
  folders: PersistedFolderDescription[];
  /** page or continuation token is different depending on provider, so pass
   * what's returned in previous describeFolderChildren calls */
  page?: unknown | null;
}

interface FilePersistenceNormalizeFileParams {
  agent: Agent;
  workspaceId: string;
  mountId: string;
  file: PersistedFileDescription;
}

interface FilePersistenceNormalizeFolderParams {
  agent: Agent;
  workspaceId: string;
  mountId: string;
  folder: PersistedFolderDescription;
}

type FilePersistenceNormalizedFile = Omit1<File, 'idPath' | 'parentId'>;
type FilePersistenceNormalizedFolder = Omit1<Folder, 'idPath' | 'parentId'>;

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

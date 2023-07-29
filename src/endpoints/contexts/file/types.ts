import {Readable} from 'stream';

export interface FilePersistenceUploadFileParams {
  bucket: string;
  key: string;
  body: Readable;
  contentLength: number;
  // contentType?: string;
  // contentEncoding?: string;
}

export interface FilePersistenceGetFileParams {
  bucket: string;
  key: string;
}

export interface FilePersistenceDeleteFilesParams {
  bucket: string;
  keys: string[];
}

export interface IPersistedFile {
  body?: Readable;
  contentLength?: number;
}

export interface FilePersistenceProviderContext {
  uploadFile: (params: FilePersistenceUploadFileParams) => Promise<void>;
  getFile: (params: FilePersistenceGetFileParams) => Promise<IPersistedFile>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  ensureBucketReady: (name: string, region: string) => Promise<void>;
  close: () => Promise<void>;
}

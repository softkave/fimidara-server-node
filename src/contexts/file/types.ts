import {DisposableResource} from 'softkave-js-utils';
import {Readable} from 'stream';
import {
  FileBackendConfig,
  FileBackendMount,
} from '../../definitions/fileBackend.js';

export type FilePersistenceProviderFeature =
  | 'describeFile'
  | 'describeFolder'
  | 'describeFolderContent'
  | 'uploadFile'
  | 'readFile'
  | 'deleteFiles'
  | 'deleteFolders';

export interface FilePersistenceDefaultParams {
  workspaceId: string;
  mount: FileBackendMount;
}

interface FilepathMatcher {
  fileId: string | undefined;
  /** should not include workspace rootname */
  filepath: string;
}

interface FolderpathMatcher {
  /** should not include workspace rootname */
  folderpath: string;
}

export interface FilePersistenceUploadFileParams
  extends FilePersistenceDefaultParams,
    FilepathMatcher {
  body: Readable;
  mount: FileBackendMount;
  mimetype?: string;
  encoding?: string;
  fileId: string;
}

export type FilePersistenceUploadFileResult<TRaw = any> = Pick<
  PersistedFileDescription<TRaw>,
  'filepath' | 'raw'
>;

export interface FilePersistenceGetFileParams
  extends FilePersistenceDefaultParams,
    FilepathMatcher {
  fileId: string;
}

export interface FilePersistenceDescribeFileParams
  extends FilePersistenceDefaultParams,
    FilepathMatcher {}

export interface FilePersistenceDescribeFolderParams
  extends FilePersistenceDefaultParams,
    FolderpathMatcher {}

export interface FilePersistenceDeleteFilesParams
  extends FilePersistenceDefaultParams {
  files: Array<FilepathMatcher & {fileId: string}>;
}

export interface PersistedFile {
  body?: Readable;
  size?: number;
}

export interface PersistedFileDescription<TRaw = any> {
  size?: number;
  lastUpdatedAt?: number;
  mimetype?: string;
  encoding?: string;
  mountId: string;
  filepath: string;
  /** Mount file data */
  raw: TRaw;
}

export interface PersistedFolderDescription<TRaw = any> {
  folderpath: string;
  mountId: string;
  /** Mount folder data */
  raw: TRaw;
}

export interface FilePersistenceDescribeFolderFilesParams
  extends FilePersistenceDefaultParams,
    FolderpathMatcher {
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
}

export interface FilePersistenceDescribeFolderContentParams
  extends FilePersistenceDefaultParams,
    FolderpathMatcher {
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
}

export interface FilePersistenceDescribeFolderFoldersParams
  extends FilePersistenceDefaultParams,
    FolderpathMatcher {
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
}

export interface FilePersistenceDeleteFoldersParams
  extends FilePersistenceDefaultParams {
  folders: Array<FolderpathMatcher>;
}

export interface FilePersistenceDescribeFolderFilesResult<TRaw = any> {
  files: PersistedFileDescription<TRaw>[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FilePersistenceDescribeFolderContentResult<
  TFileRaw = any,
  TFolderRaw = any,
> {
  files: PersistedFileDescription<TFileRaw>[];
  folders: PersistedFolderDescription<TFolderRaw>[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FilePersistenceDescribeFolderFoldersResult<TRaw = any> {
  folders: PersistedFolderDescription<TRaw>[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FilePersistenceAddFolderParams extends FolderpathMatcher {}

export interface FilePersistenceAddFolderResult<TRaw> {
  folder?: PersistedFolderDescription<TRaw>;
}

export interface FilePersistenceToFimidaraPathParams
  extends Pick<FilePersistenceDefaultParams, 'mount'> {
  nativePath: string;
}

export interface FilePersistenceToFimidaraPathResult {
  fimidaraPath: string;
}

export interface FimidaraToFilePersistencePathParams
  extends Pick<FilePersistenceDefaultParams, 'mount'> {
  fimidaraPath: string;
}

export interface FimidaraToFilePersistencePathResult {
  nativePath: string;
}

// TODO: implement a better way to specify TRaw
export interface FilePersistenceProvider extends DisposableResource {
  supportsFeature: (feature: FilePersistenceProviderFeature) => boolean;
  uploadFile: (
    params: FilePersistenceUploadFileParams
  ) => Promise<FilePersistenceUploadFileResult>;
  readFile: (params: FilePersistenceGetFileParams) => Promise<PersistedFile>;
  describeFile: (
    params: FilePersistenceDescribeFileParams
  ) => Promise<PersistedFileDescription | undefined>;
  describeFolder: (
    params: FilePersistenceDescribeFolderParams
  ) => Promise<PersistedFolderDescription | undefined>;
  describeFolderContent: (
    params: FilePersistenceDescribeFolderContentParams
  ) => Promise<FilePersistenceDescribeFolderContentResult>;
  deleteFiles: (params: FilePersistenceDeleteFilesParams) => Promise<void>;
  deleteFolders: (params: FilePersistenceDeleteFoldersParams) => Promise<void>;
  toNativePath: (
    params: FimidaraToFilePersistencePathParams
  ) => FimidaraToFilePersistencePathResult;
  toFimidaraPath: (
    params: FilePersistenceToFimidaraPathParams
  ) => FilePersistenceToFimidaraPathResult;
}

export type FileProviderResolver = (
  mount: FileBackendMount,
  initParams?: unknown,
  config?: FileBackendConfig
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => FilePersistenceProvider;

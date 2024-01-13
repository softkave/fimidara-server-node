import {Readable} from 'stream';
import {File} from '../../../definitions/file';
import {FileBackendConfig, FileBackendMount} from '../../../definitions/fileBackend';
import {DisposableResource} from '../../../utils/disposables';

export type FilePersistenceProviderFeature =
  | 'describeFile'
  | 'describeFolder'
  | 'describeFolderFiles'
  | 'describeFolderFolders'
  | 'uploadFile'
  | 'readFile'
  | 'deleteFiles'
  | 'deleteFolders';

interface DefaultMatcher {
  workspaceId: string;
  mount: FileBackendMount;
  /** Not a real word, but I like it. It's a prefix appended to native file and
   * folderpaths for multi-tenancy. fimidara mount uses another backend
   * underneath (e.g local, s3, etc), and to maintain uniqueness, each entry
   * needs a prefix or appendum (which can be the workspaceId). */
  appendum?: string;
}

interface FilepathMatcher extends DefaultMatcher {
  /** should not include workspace rootname */
  filepath: string;
}

interface FolderpathMatcher extends DefaultMatcher {
  /** should not include workspace rootname */
  folderpath: string;
}

interface FilepathListMatcher extends DefaultMatcher {
  /** should not include workspace rootname */
  filepaths: string[];
}

interface FolderpathListMatcher extends DefaultMatcher {
  /** should not include workspace rootname */
  folderpaths: string[];
}

export interface FilePersistenceUploadFileParams extends FilepathMatcher {
  body: Readable;
  mount: FileBackendMount;
  mimetype?: string;
  encoding?: string;
}

export interface FilePersistenceGetFileParams extends FilepathMatcher {}

export interface FilePersistenceDescribeFolderParams extends FolderpathMatcher {}

export interface FilePersistenceDeleteFilesParams extends FilepathListMatcher {}

export interface PersistedFile {
  body?: Readable;
  size?: number;
}

export interface PersistedFileDescription {
  size?: number;
  lastUpdatedAt?: number;
  mimetype?: string;
  encoding?: string;
  mountId: string;
  filepath: string;
}

export interface PersistedFolderDescription {
  folderpath: string;
  mountId: string;
}

export interface FilePersistenceDescribeFolderFilesParams extends FolderpathMatcher {
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
}

export interface FilePersistenceDescribeFolderFoldersParams extends FolderpathMatcher {
  max: number;
  /* `continuationToken` is backend-dependent */
  continuationToken?: unknown;
}

export interface FilePersistenceDeleteFoldersParams extends FolderpathListMatcher {}

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

export interface FilePersistenceAddFolderParams extends FolderpathMatcher {}

export interface FilePersistenceAddFolderResult {
  folder?: PersistedFolderDescription;
}

export interface FilePersistenceToFimidaraPathParams
  extends Pick<DefaultMatcher, 'mount'> {
  nativePath: string;
}

export interface FilePersistenceToFimidaraPathResult {
  fimidaraPath: string;
}

export interface FimidaraToFilePersistencePathParams
  extends Pick<DefaultMatcher, 'mount'> {
  fimidaraPath: string;
}

export interface FimidaraToFilePersistencePathResult {
  nativePath: string;
}

export interface FilePersistenceProvider extends DisposableResource {
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
  toNativePath: (
    params: FimidaraToFilePersistencePathParams
  ) => FimidaraToFilePersistencePathResult;
  toFimidaraPath: (
    params: FilePersistenceToFimidaraPathParams
  ) => FilePersistenceToFimidaraPathResult;
}

export type FileProviderResolver = (
  mount: FileBackendMount,
  initParams: unknown,
  config: FileBackendConfig
) => FilePersistenceProvider;

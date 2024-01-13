import {isArray, isNumber, isObject} from 'lodash';
import path from 'path';
import {File} from '../../../definitions/file';
import {kFimidaraConfigFilePersistenceProvider} from '../../../resources/config';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {FileQueries} from '../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {FolderQueries} from '../../folders/queries';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../folders/utils';
import {kSemanticModels, kUtilsInjectables} from '../injection/injectables';
import LocalFsFilePersistenceProvider from './LocalFsFilePersistenceProvider';
import MemoryFilePersistenceProvider from './MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from './S3FilePersistenceProvider';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFilesResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderFoldersResult,
  FilePersistenceDescribeFolderParams,
  FilePersistenceGetFileParams,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types';

/** Seeing the root folder is mounted on fimidara, when we ingest new files or
 * folders from other mounts, there's a possiblity they'll be re-fetched in
 * subsequent fetchs when listing folder content, so we avoid this by fetching
 * files or folders created after a date, and exclude the ones we have already.
 * */
export interface FimidaraFilePersistenceProviderPage {
  page: number;
  createdAt: number;
  exclude: string[];
}

export class FimidaraFilePersistenceProvider implements FilePersistenceProvider {
  static isPage(page: unknown): page is FimidaraFilePersistenceProviderPage {
    return (
      isObject(page) &&
      isNumber((page as FimidaraFilePersistenceProviderPage).createdAt) &&
      isNumber((page as FimidaraFilePersistenceProviderPage).page) &&
      isArray((page as FimidaraFilePersistenceProviderPage).exclude)
    );
  }

  backend: FilePersistenceProvider;

  constructor() {
    this.backend = this.getBackend();
  }

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'deleteFolders':
      case 'describeFile':
      case 'describeFolder':
      case 'describeFolderFiles':
      case 'describeFolderFolders':
      case 'readFile':
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (
    params: FilePersistenceUploadFileParams
  ): Promise<Partial<File>> => {
    return await this.backend.uploadFile(this.prefixParamsPath(params));
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    return await this.backend.readFile(this.prefixParamsPath(params));
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {workspaceId, filepath, mount} = params;
    const {namepath, extension} = getFilepathInfo(filepath, {containsRootname: false});
    const entry = await kSemanticModels.resolvedMountEntry().getOneByQuery({
      ...FileQueries.getByNamepath({workspaceId, namepath, extension}),
      mountId: mount.resourceId,
    });

    if (entry) {
      return {
        filepath,
        lastUpdatedAt: entry.lastUpdatedAt,
        size: entry.other?.size,
        mimetype: entry.other?.mimetype,
        encoding: entry.other?.encoding,
        mountId: mount.resourceId,
      };
    }

    return undefined;
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    const {workspaceId, folderpath, mount} = params;
    const {namepath} = getFolderpathInfo(folderpath);
    const folder = await kSemanticModels
      .folder()
      .getOneByQuery(FolderQueries.getByNamepath({workspaceId, namepath}));

    if (folder) {
      return {folderpath, mountId: mount.resourceId};
    }

    return undefined;
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams): Promise<void> => {
    await this.backend.deleteFiles(this.prefixParamsPath(params));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder endpoint will do that
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {page: 0, createdAt: Number.MAX_SAFE_INTEGER, exclude: []};

    const pathinfo = getFolderpathInfo(folderpath);
    const entries = await kSemanticModels.resolvedMountEntry().getManyByQuery(
      {
        ...FolderQueries.getByParentPath({workspaceId, namepath: pathinfo.namepath}),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: {$nin: currentPage.exclude},
        mountId: mount.resourceId,
      },
      {pageSize: max, sort: {createdAt: 'descending'}}
    );

    let createdAtN = currentPage.createdAt;
    let exclude: string[] = currentPage.exclude;

    const childrenFiles = entries.map((entry): PersistedFileDescription => {
      if (entry.createdAt < createdAtN) {
        createdAtN = entry.createdAt;
        exclude = [];
      }

      exclude.push(entry.resourceId);
      return {
        filepath: stringifyFilenamepath(entry),
        lastUpdatedAt: entry.lastUpdatedAt,
        size: entry.other?.size,
        mimetype: entry.other?.mimetype,
        encoding: entry.other?.encoding,
        mountId: mount.resourceId,
      };
    });

    const nextPage: FimidaraFilePersistenceProviderPage = {
      exclude,
      page: currentPage.page++,
      createdAt: createdAtN,
    };

    return {continuationToken: nextPage, files: childrenFiles};
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {page: 0, createdAt: Number.MAX_SAFE_INTEGER, exclude: []};

    const pathinfo = getFolderpathInfo(folderpath);
    const folders = await kSemanticModels.folder().getManyByQuery(
      {
        ...FolderQueries.getByParentPath({workspaceId, namepath: pathinfo.namepath}),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: {$nin: currentPage.exclude},
      },
      {pageSize: max, sort: {createdAt: 'descending'}}
    );

    let createdAtN = currentPage.createdAt;
    let exclude: string[] = [];

    const childrenFolders = folders.map((folder): PersistedFolderDescription => {
      if (folder.createdAt < createdAtN) {
        createdAtN = folder.createdAt;
        exclude = [];
      }

      exclude.push(folder.resourceId);
      return {folderpath: stringifyFoldernamepath(folder), mountId: mount.resourceId};
    });

    const nextPage: FimidaraFilePersistenceProviderPage = {
      exclude,
      page: currentPage.page++,
      createdAt: createdAtN,
    };

    return {continuationToken: nextPage, folders: childrenFolders};
  };

  dispose = async () => {
    await this.backend.dispose();
  };

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    return {nativePath: params.fimidaraPath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    return {fimidaraPath: params.nativePath};
  };

  protected getBackend = (): FilePersistenceProvider => {
    const config = kUtilsInjectables.suppliedConfig();

    switch (config.fileBackend) {
      case kFimidaraConfigFilePersistenceProvider.s3:
        appAssert(config.awsConfig?.accessKeyId);
        appAssert(config.awsConfig?.region);
        appAssert(config.awsConfig?.secretAccessKey);
        return new S3FilePersistenceProvider(config.awsConfig);
      case kFimidaraConfigFilePersistenceProvider.fs:
        appAssert(config.localFsDir);
        return new LocalFsFilePersistenceProvider({dir: config.localFsDir});
      case kFimidaraConfigFilePersistenceProvider.memory:
        return new MemoryFilePersistenceProvider();
      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend || '');
    }
  };

  protected prefixPath(workspaceId: string, p: string): string {
    return path.normalize(`${workspaceId}/${p}`);
  }

  /** Prefixes file and folder paths with workspace ID for uniqueness due to
   * multi-tenancy. */
  protected prefixParamsPath<
    T extends {
      workspaceId: string;
      filepath?: string;
      folderpath?: string;
      folderpaths?: string[];
      filepaths?: string[];
    },
  >(params: T): T {
    if (params.filepath) {
      params.filepath = this.prefixPath(params.workspaceId, params.filepath);
      return params;
    } else if (params.folderpath) {
      params.folderpath = this.prefixPath(params.workspaceId, params.folderpath);
      return params;
    } else if (params.filepaths) {
      params.filepaths = params.filepaths.map(p =>
        this.prefixPath(params.workspaceId, p)
      );
    } else if (params.folderpaths) {
      params.folderpaths = params.folderpaths.map(p =>
        this.prefixPath(params.workspaceId, p)
      );
    }

    return params;
  }
}

import {isArray, isNumber, isObject} from 'lodash';
import {File} from '../../../definitions/file';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../folders/utils';
import {kSemanticModels, kUtilsInjectables} from '../injectables';
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
  FilePersistenceUploadFileParams,
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
        return true;
      case 'deleteFolders':
        return true;
      case 'describeFile':
        return true;
      case 'describeFolder':
        return true;
      case 'describeFolderFiles':
        return true;
      case 'describeFolderFolders':
        return true;
      case 'readFile':
        return true;
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (
    params: FilePersistenceUploadFileParams
  ): Promise<Partial<File>> => {
    return await this.backend.uploadFile(params);
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    return await this.backend.readFile(params);
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const {workspaceId, filepath, mount} = params;
    const {namepath, extension} = getFilepathInfo(filepath);
    const file = await kSemanticModels.file().getOneByQuery({
      workspaceId,
      extension,
      namepath: {$all: namepath, $size: namepath.length},
      resolvedEntries: {$elemMatch: {mountId: mount.resourceId}},
    });

    if (file) {
      return {
        filepath,
        type: 'file',
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
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
    const folder = await kSemanticModels.folder().getOneByQuery({
      workspaceId,
      namepath: {$all: namepath, $size: namepath.length},
      resolvedEntries: {$elemMatch: {mountId: mount.resourceId}},
    });

    if (folder) {
      return {folderpath, type: 'folder', mountId: mount.resourceId};
    }

    return undefined;
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams): Promise<void> => {
    await this.backend.deleteFiles(params);
  };

  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder will do that
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
    const files = await kSemanticModels.file().getManyByQuery(
      {
        workspaceId,
        namepath: {$all: pathinfo.namepath, $size: pathinfo.namepath.length},
        createdAt: {$lte: currentPage.createdAt},
        resourceId: {$nin: currentPage.exclude},
        resolvedEntries: {$elemMatch: {mountId: mount.resourceId}},
      },
      {pageSize: max, sort: {createdAt: 'descending'}}
    );

    let createdAtN = currentPage.createdAt;
    let exclude: string[] = currentPage.exclude;

    const childrenFiles = files.map((file): PersistedFileDescription => {
      if (file.createdAt < createdAtN) {
        createdAtN = file.createdAt;
        exclude = [];
      }

      exclude.push(file.resourceId);
      return {
        filepath: stringifyFilenamepath(file),
        type: 'file',
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
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
        workspaceId,
        namepath: {$all: pathinfo.namepath, $size: pathinfo.namepath.length},
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
      return {
        folderpath: stringifyFoldernamepath(folder),
        type: 'folder',
        mountId: mount.resourceId,
      };
    });

    const nextPage: FimidaraFilePersistenceProviderPage = {
      exclude,
      page: currentPage.page++,
      createdAt: createdAtN,
    };

    return {continuationToken: nextPage, folders: childrenFolders};
  };

  close = async () => {
    await this.backend.close();
  };

  protected getBackend = (): FilePersistenceProvider => {
    const config = kUtilsInjectables.config();

    if (config.fileBackend === 'fimidara') {
      throw new Error(
        'Restart the server with a different file backend besides fimidara'
      );
    }

    switch (config.fileBackend) {
      case 'aws-s3':
        appAssert(config.awsConfig);
        return new S3FilePersistenceProvider(config.awsConfig);
      case 'local-fs':
        appAssert(config.localFsDir);
        return new LocalFsFilePersistenceProvider({dir: config.localFsDir});
      case 'memory':
        return new MemoryFilePersistenceProvider();
      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend);
    }
  };
}

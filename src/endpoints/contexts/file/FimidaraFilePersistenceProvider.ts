import {isArray, isNumber, isObject} from 'lodash';
import path from 'path';
import {File} from '../../../definitions/file';
import {kAppResourceType} from '../../../definitions/system';
import {kFimidaraConfigFilePersistenceProvider} from '../../../resources/config';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {FileQueries} from '../../files/queries';
import {getFilepathInfo, stringifyFilenamepath} from '../../files/utils';
import {FolderQueries} from '../../folders/queries';
import {getFolderpathInfo, stringifyFoldernamepath} from '../../folders/utils';
import {kSemanticModels, kUtilsInjectables} from '../injection/injectables';
import {LocalFsFilePersistenceProvider} from './LocalFsFilePersistenceProvider';
import {MemoryFilePersistenceProvider} from './MemoryFilePersistenceProvider';
import {S3FilePersistenceProvider} from './S3FilePersistenceProvider';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
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
  type: typeof kAppResourceType.File | typeof kAppResourceType.Folder;
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
      case 'describeFolderContent':
      case 'readFile':
      case 'uploadFile':
        return true;
    }
  };

  uploadFile = async (
    params: FilePersistenceUploadFileParams
  ): Promise<Partial<File>> => {
    return await this.backend.uploadFile(this.prepareParams(params));
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    return await this.backend.readFile(this.prepareParams(params));
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
    const {namepath} = getFolderpathInfo(folderpath, {containsRootname: false});
    const folder = await kSemanticModels
      .folder()
      .getOneByQuery(FolderQueries.getByNamepath({workspaceId, namepath}));

    if (folder) {
      return {folderpath, mountId: mount.resourceId};
    }

    return undefined;
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams): Promise<void> => {
    await this.backend.deleteFiles(this.prepareParams(params));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder endpoint will do that
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult> => {
    const {continuationToken} = params;
    let filesResult: FilePersistenceDescribeFolderFilesResult | undefined;
    let foldersResult: FilePersistenceDescribeFolderFoldersResult | undefined;

    if (FimidaraFilePersistenceProvider.isPage(continuationToken)) {
      if (continuationToken.type === kAppResourceType.File) {
        // Continue fetching files
        filesResult = await this.describeFolderFiles(params);
      } else if (continuationToken.type === kAppResourceType.Folder) {
        // Continue fetching folders
        foldersResult = await this.describeFolderFolders(params);
      }
    }

    if (!filesResult && !foldersResult) {
      // New call, start fetching files
      filesResult = await this.describeFolderFiles(params);
    }

    if (filesResult && filesResult.files.length < params.max) {
      // We've fetched files, but do not meet max quota
      foldersResult = await this.describeFolderFolders({
        ...params,
        max: params.max - filesResult.files.length,
        continuationToken: undefined,
      });
    }

    return {
      files: filesResult?.files || [],
      folders: foldersResult?.folders || [],
      continuationToken:
        filesResult?.continuationToken || foldersResult?.continuationToken,
    };
  };

  describeFolderFiles = async (
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {
            page: 0,
            createdAt: Number.MAX_SAFE_INTEGER,
            exclude: [],
            type: kAppResourceType.File,
          };

    const pathinfo = getFolderpathInfo(folderpath, {containsRootname: false});
    const entries = await kSemanticModels.resolvedMountEntry().getManyByQuery(
      {
        ...FolderQueries.getByParentPath({workspaceId, namepath: pathinfo.namepath}),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: currentPage.exclude?.length ? {$nin: currentPage.exclude} : undefined,
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
      type: kAppResourceType.File,
    };

    return {
      continuationToken: childrenFiles.length > 0 ? nextPage : undefined,
      files: childrenFiles,
    };
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {
            page: 0,
            createdAt: Number.MAX_SAFE_INTEGER,
            exclude: [],
            type: kAppResourceType.Folder,
          };

    const pathinfo = getFolderpathInfo(folderpath, {containsRootname: false});
    const folders = await kSemanticModels.folder().getManyByQuery(
      {
        ...FolderQueries.getByParentPath({workspaceId, namepath: pathinfo.namepath}),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: currentPage.exclude?.length ? {$nin: currentPage.exclude} : undefined,
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
      type: kAppResourceType.Folder,
    };

    return {
      continuationToken: childrenFolders.length > 0 ? nextPage : undefined,
      folders: childrenFolders,
    };
  };

  dispose = async () => {
    if (this.backend.dispose) {
      await this.backend.dispose();
    }
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

  prepareParams<TParams extends {postMountedFromPrefix?: string[]; workspaceId: string}>(
    params: TParams
  ): TParams {
    return {...params, postMountedFromPrefix: [params.workspaceId]};
  }

  protected getBackend = (): FilePersistenceProvider => {
    const config = kUtilsInjectables.suppliedConfig();

    switch (config.fileBackend) {
      case kFimidaraConfigFilePersistenceProvider.s3:
        appAssert(config.awsConfig?.accessKeyId);
        appAssert(config.awsConfig?.region);
        appAssert(config.awsConfig?.secretAccessKey);
        return new S3FilePersistenceProvider(config.awsConfig);
      case kFimidaraConfigFilePersistenceProvider.fs: {
        appAssert(config.localFsDir);
        const pathResolved = path.resolve(config.localFsDir);
        return new LocalFsFilePersistenceProvider({dir: pathResolved});
      }
      case kFimidaraConfigFilePersistenceProvider.memory:
        return new MemoryFilePersistenceProvider();
      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend || '');
    }
  };
}

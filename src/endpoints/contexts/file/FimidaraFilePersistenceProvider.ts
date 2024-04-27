import {isArray, isNumber, isObject, merge} from 'lodash';
import path from 'path';
import {kFimidaraResourceType} from '../../../definitions/system';
import {kFimidaraConfigFilePersistenceProvider} from '../../../resources/config';
import {appAssert} from '../../../utils/assertion';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {FileBackendQueries} from '../../fileBackends/queries';
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
  FilePersistenceDescribeFileParams,
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
  FilePersistenceUploadFileResult,
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
  type: typeof kFimidaraResourceType.File | typeof kFimidaraResourceType.Folder;
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
  ): Promise<FilePersistenceUploadFileResult> => {
    const preparedParams = this.prepareParams(params);
    await this.backend.uploadFile(preparedParams);
    return {filepath: params.filepath, raw: undefined};
  };

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    return await this.backend.readFile(this.prepareParams(params));
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<PersistedFileDescription<undefined> | undefined> => {
    const {workspaceId, filepath, mount} = params;
    const {namepath, ext} = getFilepathInfo(filepath, {
      containsRootname: false,
      allowRootFolder: false,
    });
    const entry = await kSemanticModels.resolvedMountEntry().getOneByQuery({
      ...FileBackendQueries.getByBackendNamepath({
        workspaceId,
        backendNamepath: namepath,
        backendExt: ext,
      }),
      mountId: mount.resourceId,
    });

    if (entry) {
      appAssert(entry.forType === kFimidaraResourceType.File);
      const other = entry.persisted as PersistedFileDescription;
      return {
        filepath,
        raw: undefined,
        lastUpdatedAt: entry.lastUpdatedAt,
        size: other.size,
        mimetype: other.mimetype,
        encoding: other.encoding,
        mountId: mount.resourceId,
      };
    }

    return undefined;
  };

  describeFolder = async (
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription<undefined> | undefined> => {
    const {workspaceId, folderpath, mount} = params;
    const {namepath} = getFolderpathInfo(folderpath, {
      containsRootname: false,
      allowRootFolder: false,
    });
    const folder = await kSemanticModels
      .folder()
      .getOneByQuery(FolderQueries.getByNamepath({workspaceId, namepath}));

    if (folder) {
      return {folderpath, mountId: mount.resourceId, raw: undefined};
    }

    return undefined;
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams): Promise<void> => {
    const fParams = params.files.map(fParam => this.prepareParams(fParam));
    await this.backend.deleteFiles({...params, files: fParams});
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder endpoint will do that
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult<undefined, undefined>> => {
    const {continuationToken} = params;
    let filesResult: FilePersistenceDescribeFolderFilesResult<undefined> | undefined;
    let foldersResult: FilePersistenceDescribeFolderFoldersResult<undefined> | undefined;

    if (FimidaraFilePersistenceProvider.isPage(continuationToken)) {
      if (continuationToken.type === kFimidaraResourceType.File) {
        // Continue fetching files
        filesResult = await this.describeFolderFiles(params);
      } else if (continuationToken.type === kFimidaraResourceType.Folder) {
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
  ): Promise<FilePersistenceDescribeFolderFilesResult<undefined>> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {
            page: 0,
            createdAt: Number.MAX_SAFE_INTEGER,
            exclude: [],
            type: kFimidaraResourceType.File,
          };

    const pathinfo = getFolderpathInfo(folderpath, {
      containsRootname: false,
      allowRootFolder: false,
    });
    const entries = await kSemanticModels.resolvedMountEntry().getManyByQuery(
      {
        ...FileBackendQueries.getByParentBackendPath({
          workspaceId,
          backendNamepath: pathinfo.namepath,
        }),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: currentPage.exclude?.length ? {$nin: currentPage.exclude} : undefined,
        mountId: mount.resourceId,
      },
      {pageSize: max, sort: {createdAt: 'descending'}}
    );

    let createdAtN = currentPage.createdAt;
    let exclude: string[] = currentPage.exclude;

    const childrenFiles = entries.map((entry): PersistedFileDescription<undefined> => {
      if (entry.createdAt < createdAtN) {
        createdAtN = entry.createdAt;
        exclude = [];
      }

      exclude.push(entry.resourceId);
      appAssert(entry.forType === kFimidaraResourceType.File);
      const other = entry.persisted as PersistedFileDescription;
      return {
        raw: undefined,
        filepath: stringifyFilenamepath({
          namepath: entry.backendNamepath,
          ext: entry.backendExt,
        }),
        lastUpdatedAt: entry.lastUpdatedAt,
        size: other.size,
        mimetype: other.mimetype,
        encoding: other.encoding,
        mountId: mount.resourceId,
      };
    });

    const nextPage: FimidaraFilePersistenceProviderPage = {
      exclude,
      page: currentPage.page++,
      createdAt: createdAtN,
      type: kFimidaraResourceType.File,
    };

    return {
      continuationToken: childrenFiles.length > 0 ? nextPage : undefined,
      files: childrenFiles,
    };
  };

  describeFolderFolders = async (
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult<undefined>> => {
    const {folderpath, max, workspaceId, continuationToken: page, mount} = params;
    const currentPage: FimidaraFilePersistenceProviderPage =
      FimidaraFilePersistenceProvider.isPage(page)
        ? page
        : {
            page: 0,
            createdAt: Number.MAX_SAFE_INTEGER,
            exclude: [],
            type: kFimidaraResourceType.Folder,
          };

    const pathinfo = getFolderpathInfo(folderpath, {
      containsRootname: false,
      allowRootFolder: false,
    });

    // TODO: we use should resolve mount entries instead
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

    const childrenFolders = folders.map(
      (folder): PersistedFolderDescription<undefined> => {
        if (folder.createdAt < createdAtN) {
          createdAtN = folder.createdAt;
          exclude = [];
        }

        exclude.push(folder.resourceId);
        return {
          folderpath: stringifyFoldernamepath(folder),
          mountId: mount.resourceId,
          raw: undefined,
        };
      }
    );

    const nextPage: FimidaraFilePersistenceProviderPage = {
      exclude,
      page: currentPage.page++,
      createdAt: createdAtN,
      type: kFimidaraResourceType.Folder,
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

  prepareParams<TParams extends {fileId: string; filepath: string}>(
    params: TParams
  ): TParams {
    return {...params, filepath: params.fileId};
  }

  protected getBackend = (): FilePersistenceProvider => {
    const config = kUtilsInjectables.suppliedConfig();

    switch (config.fileBackend) {
      case kFimidaraConfigFilePersistenceProvider.s3: {
        const awsConfig = merge(config.awsConfigs?.all, config.awsConfigs?.s3);
        appAssert(awsConfig, 'No AWS config provided for AWS S3 provider');
        appAssert(
          awsConfig?.accessKeyId,
          'No AWS accessKeyId provided for AWS S3 provider'
        );
        appAssert(awsConfig?.region, 'No AWS region provided for AWS S3 provider');
        appAssert(
          awsConfig?.secretAccessKey,
          'No AWS secretAccessKey provided for AWS S3 provider'
        );
        return new S3FilePersistenceProvider(awsConfig);
      }
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

import assert from 'assert';
import {isArray, isNumber, isObject, merge} from 'lodash-es';
import path from 'path';
import {pathJoin} from 'softkave-js-utils';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {FileBackendQueries} from '../../endpoints/fileBackends/queries.js';
import {
  getFilepathInfo,
  stringifyFilenamepath,
} from '../../endpoints/files/utils.js';
import {FolderQueries} from '../../endpoints/folders/queries.js';
import {
  getFolderpathInfo,
  stringifyFolderpath,
} from '../../endpoints/folders/utils.js';
import {kFimidaraConfigFilePersistenceProvider} from '../../resources/config.js';
import {appAssert} from '../../utils/assertion.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {kIjxSemantic, kIjxUtils} from '../ijx/injectables.js';
import {LocalFsFilePersistenceProvider} from './LocalFsFilePersistenceProvider.js';
import {MemoryFilePersistenceProvider} from './MemoryFilePersistenceProvider.js';
import {S3FilePersistenceProvider} from './S3FilePersistenceProvider.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceDefaultParams,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDeleteMultipartUploadPartParams,
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
  FilePersistenceStartMultipartUploadParams,
  FilePersistenceStartMultipartUploadResult,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FilePersistenceUploadFileResult,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types.js';

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

export class FimidaraFilePersistenceProvider
  implements FilePersistenceProvider
{
  static isPage(page: unknown): page is FimidaraFilePersistenceProviderPage {
    return (
      isObject(page) &&
      isNumber((page as FimidaraFilePersistenceProviderPage).createdAt) &&
      isNumber((page as FimidaraFilePersistenceProviderPage).page) &&
      isArray((page as FimidaraFilePersistenceProviderPage).exclude)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const result = await this.backend.uploadFile(preparedParams);
    return result;
  };

  startMultipartUpload = async (
    params: FilePersistenceStartMultipartUploadParams
  ): Promise<FilePersistenceStartMultipartUploadResult> => {
    const preparedParams = this.prepareParams(params);
    return this.backend.startMultipartUpload(preparedParams);
  };

  deleteMultipartUploadPart = async (
    params: FilePersistenceDeleteMultipartUploadPartParams
  ) => {
    const preparedParams = this.prepareParams(params);
    return this.backend.deleteMultipartUploadPart(preparedParams);
  };

  completeMultipartUpload = async (
    params: FilePersistenceCompleteMultipartUploadParams
  ) => {
    const preparedParams = this.prepareParams(params);
    return await this.backend.completeMultipartUpload(preparedParams);
  };

  cleanupMultipartUpload = (
    params: FilePersistenceCleanupMultipartUploadParams
  ) => {
    const preparedParams = this.prepareParams(params);
    return this.backend.cleanupMultipartUpload(preparedParams);
  };

  readFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFile> => {
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
    const entry = await kIjxSemantic.resolvedMountEntry().getOneByQuery({
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
    const folder = await kIjxSemantic
      .folder()
      .getOneByQuery(FolderQueries.getByNamepath({workspaceId, namepath}));

    if (folder) {
      return {folderpath, mountId: mount.resourceId, raw: undefined};
    }

    return undefined;
  };

  deleteFiles = async (
    params: FilePersistenceDeleteFilesParams
  ): Promise<void> => {
    const fParams = params.files.map(fParam =>
      this.prepareFileParams({
        workspaceId: params.workspaceId,
        ...fParam,
      })
    );
    await this.backend.deleteFiles({...params, files: fParams});
  };

  deleteFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDeleteFoldersParams
  ): Promise<void> => {
    // fimidara persisted folders are stored in DB, so no need to delete them
    // here, seeing deleteFolder endpoint will do that
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<
    FilePersistenceDescribeFolderContentResult<undefined, undefined>
  > => {
    const {continuationToken} = params;
    let filesResult:
      | FilePersistenceDescribeFolderFilesResult<undefined>
      | undefined;
    let foldersResult:
      | FilePersistenceDescribeFolderFoldersResult<undefined>
      | undefined;

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
    const {
      folderpath,
      max,
      workspaceId,
      continuationToken: page,
      mount,
    } = params;
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
    const entries = await kIjxSemantic.resolvedMountEntry().getManyByQuery(
      {
        ...FileBackendQueries.getByParentBackendPath({
          workspaceId,
          backendNamepath: pathinfo.namepath,
        }),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: currentPage.exclude?.length
          ? {$nin: currentPage.exclude}
          : undefined,
        mountId: mount.resourceId,
      },
      {pageSize: max, sort: {createdAt: 'descending'}}
    );

    let createdAtN = currentPage.createdAt;
    let exclude: string[] = currentPage.exclude;

    const childrenFiles = entries.map(
      (entry): PersistedFileDescription<undefined> => {
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
      }
    );

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
    const {
      folderpath,
      max,
      workspaceId,
      continuationToken: page,
      mount,
    } = params;
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
    const folders = await kIjxSemantic.folder().getManyByQuery(
      {
        ...FolderQueries.getByParentPath({
          workspaceId,
          namepath: pathinfo.namepath,
        }),
        createdAt: {$lte: currentPage.createdAt},
        resourceId: currentPage.exclude?.length
          ? {$nin: currentPage.exclude}
          : undefined,
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
          folderpath: stringifyFolderpath(folder),
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

  prepareFileParams<
    TParams extends Pick<FilePersistenceDefaultParams, 'workspaceId'> & {
      fileId: string;
      filepath: string;
    },
  >(params: TParams): TParams {
    return {
      ...params,
      filepath: pathJoin({input: [params.workspaceId, params.fileId]}),
    };
  }

  prepareParams<
    TParams extends FilePersistenceDefaultParams & {
      fileId: string;
      filepath: string;
    },
  >(params: TParams): TParams {
    const config = kIjxUtils.suppliedConfig();
    let mount = params.mount;

    if (config.fileBackend === kFimidaraConfigFilePersistenceProvider.s3) {
      const s3Bucket = config.awsConfigs?.s3Bucket;
      assert(s3Bucket);
      mount = {...mount, mountedFrom: [s3Bucket]};
    }

    return {
      ...params,
      ...this.prepareFileParams(params),
      mount,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getBackend = (): FilePersistenceProvider => {
    const config = kIjxUtils.suppliedConfig();

    switch (config.fileBackend) {
      case kFimidaraConfigFilePersistenceProvider.s3: {
        const awsCreds = merge(
          {},
          config.awsConfigs?.all,
          config.awsConfigs?.s3
        );
        const s3Bucket = config.awsConfigs?.s3Bucket;

        appAssert(awsCreds, 'No AWS config provided for AWS S3 provider');
        appAssert(
          awsCreds?.accessKeyId,
          'No AWS accessKeyId provided for AWS S3 provider'
        );
        appAssert(
          awsCreds?.region,
          'No AWS region provided for AWS S3 provider'
        );
        appAssert(
          awsCreds?.secretAccessKey,
          'No AWS secretAccessKey provided for AWS S3 provider'
        );
        appAssert(s3Bucket, 'No AWS S3 bucket provided for AWS S3 provider');

        return new S3FilePersistenceProvider(awsCreds);
      }

      case kFimidaraConfigFilePersistenceProvider.fs: {
        appAssert(config.localFsDir);
        appAssert(config.localPartsFsDir);
        const dir = path.resolve(config.localFsDir);
        const partsDir = path.resolve(config.localPartsFsDir);
        return new LocalFsFilePersistenceProvider({dir, partsDir});
      }

      case kFimidaraConfigFilePersistenceProvider.memory:
        return new MemoryFilePersistenceProvider();

      default:
        throw kReuseableErrors.file.unknownBackend(config.fileBackend || '');
    }
  };
}

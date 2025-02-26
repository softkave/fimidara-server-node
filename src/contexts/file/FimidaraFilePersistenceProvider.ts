import assert from 'assert';
import {isArray, isNumber, isObject} from 'lodash-es';
import fetch from 'node-fetch';
import {pathJoin} from 'softkave-js-utils';
import {FilePart} from '../../definitions/file.js';
import {kFileBackendType} from '../../definitions/fileBackend.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {kEndpointConstants} from '../../endpoints/constants.js';
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
import {SysDeleteFileEndpointParams} from '../../endpoints/sys/deleteFile/types.js';
import {SysReadFileEndpointParams} from '../../endpoints/sys/readFile/types.js';
import {
  FimidaraConfigFilePersistenceProvider,
  kFimidaraConfigFilePersistenceProvider,
} from '../../resources/config.js';
import {appAssert} from '../../utils/assertion.js';
import {ServerError} from '../../utils/errors.js';
import {kReuseableErrors} from '../../utils/reusableErrors.js';
import {kSemanticModels, kUtilsInjectables} from '../injection/injectables.js';
import {
  getLocalFsDirFromSuppliedConfig,
  LocalFsFilePersistenceProvider,
  LocalFsFilePersistenceProviderGetPartStream,
  LocalFSPersistedFileBackendMetaRaw,
} from './LocalFsFilePersistenceProvider.js';
import {MemoryFilePersistenceProvider} from './MemoryFilePersistenceProvider.js';
import {
  getAWSS3ConfigFromSuppliedConfig,
  S3FilePersistenceProvider,
} from './S3FilePersistenceProvider.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadResult,
  FilePersistenceDefaultParams,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDeleteMultipartUploadPartParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFoldersParams,
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
  PersistedFileBackendMeta,
  PersistedFolderBackendMeta,
} from './types.js';

export type FimidaraPersistedFileBackendMetaRaw =
  | {
      backend: typeof kFimidaraConfigFilePersistenceProvider.fs;
      raw: LocalFSPersistedFileBackendMetaRaw;
    }
  | {
      backend: typeof kFimidaraConfigFilePersistenceProvider.memory;
    }
  | {
      backend: typeof kFimidaraConfigFilePersistenceProvider.s3;
      raw: unknown;
    };

export type FimidaraPersistedFolderBackendMetaRaw = undefined;

export interface FimidaraPersistedFileBackendMeta
  extends PersistedFileBackendMeta<FimidaraPersistedFileBackendMetaRaw> {}

export interface FimidaraFilePersistenceUploadFileResult
  extends FilePersistenceUploadFileResult<FimidaraPersistedFileBackendMetaRaw> {}

export interface FimidaraPersistedFolderBackendMeta
  extends PersistedFolderBackendMeta<FimidaraPersistedFolderBackendMetaRaw> {}

export interface FimidaraFilePersistenceDescribeFolderContentResult
  extends FilePersistenceDescribeFolderContentResult<
    FimidaraPersistedFileBackendMetaRaw,
    FimidaraPersistedFolderBackendMetaRaw
  > {}

export interface FimidaraFilePersistenceCompleteMultipartUploadResult
  extends FilePersistenceCompleteMultipartUploadResult<FimidaraPersistedFileBackendMetaRaw> {}

export interface FimidaraFilePersistenceDescribeFolderFilesResult {
  files: FimidaraPersistedFileBackendMeta[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

export interface FimidaraFilePersistenceDescribeFolderFoldersResult {
  folders: FimidaraPersistedFolderBackendMeta[];
  /* `null` or `undefined` if content is exhausted */
  continuationToken?: unknown | null;
}

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

  backend: FilePersistenceProvider;
  backendType: FimidaraConfigFilePersistenceProvider;

  constructor() {
    const config = kUtilsInjectables.suppliedConfig();
    const backendType = config.fileBackend;
    appAssert(backendType, 'No file backend provided');
    this.backend = FimidaraFilePersistenceProvider.getBackend({
      backendType,
      getPartStreamForLocalFS: sysReadPartDistributed,
    });
    this.backendType = backendType;
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
  ): Promise<FimidaraFilePersistenceUploadFileResult> => {
    const preparedParams = this.prepareParams(params);
    const result = await this.backend.uploadFile(preparedParams);
    return {
      ...result,
      raw: this.prepareFileBackendMetaRaw(result.raw),
    };
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

    switch (this.backendType) {
      case kFimidaraConfigFilePersistenceProvider.fs: {
        const serverId = getServerIdForPart(preparedParams.part);

        if (serverId === kUtilsInjectables.serverApp().getServerId()) {
          return this.backend.deleteMultipartUploadPart(preparedParams);
        } else {
          return sysDeletePartDistributed(preparedParams);
        }
      }
      default:
        return this.backend.deleteMultipartUploadPart(preparedParams);
    }
  };

  completeMultipartUpload = async (
    params: FilePersistenceCompleteMultipartUploadParams
  ): Promise<FimidaraFilePersistenceCompleteMultipartUploadResult> => {
    const preparedParams = this.prepareParams(params);
    const result = await this.backend.completeMultipartUpload(preparedParams);
    return {
      ...result,
      raw: this.prepareFileBackendMetaRaw(result.raw),
    };
  };

  cleanupMultipartUpload = async (
    params: FilePersistenceCleanupMultipartUploadParams
  ) => {
    const preparedParams = this.prepareParams(params);

    switch (this.backendType) {
      case kFimidaraConfigFilePersistenceProvider.fs: {
        const parts = await kSemanticModels.filePart().getManyByQuery({
          multipartId: preparedParams.multipartId,
        });

        const serverIds = new Set<string>();
        for (const part of parts) {
          const serverId = getServerIdForPart(part);
          serverIds.add(serverId);
        }

        for (const serverId of serverIds) {
          if (serverId === kUtilsInjectables.serverApp().getServerId()) {
            await this.backend.cleanupMultipartUpload(preparedParams);
          } else {
            await sysCleanupMultipartUploadDistributed({
              ...preparedParams,
              serverId,
            });
          }
        }

        return;
      }
      default:
        return this.backend.cleanupMultipartUpload(preparedParams);
    }
  };

  readFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFile> => {
    return await this.backend.readFile(this.prepareParams(params));
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<FimidaraPersistedFileBackendMeta | undefined> => {
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
      const other = entry.persisted as FimidaraPersistedFileBackendMeta;
      return {
        filepath,
        raw: other.raw,
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
  ): Promise<FimidaraPersistedFolderBackendMeta | undefined> => {
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
  ): Promise<FimidaraFilePersistenceDescribeFolderContentResult> => {
    const {continuationToken} = params;
    let filesResult:
      | FimidaraFilePersistenceDescribeFolderFilesResult
      | undefined;
    let foldersResult:
      | FimidaraFilePersistenceDescribeFolderFoldersResult
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
  ): Promise<FimidaraFilePersistenceDescribeFolderFilesResult> => {
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

    const entries = await kSemanticModels.resolvedMountEntry().getManyByQuery(
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
      (entry): FimidaraPersistedFileBackendMeta => {
        if (entry.createdAt < createdAtN) {
          createdAtN = entry.createdAt;
          exclude = [];
        }

        exclude.push(entry.resourceId);
        appAssert(entry.forType === kFimidaraResourceType.File);
        const other = entry.persisted as FimidaraPersistedFileBackendMeta;
        return {
          raw: other.raw,
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
  ): Promise<FimidaraFilePersistenceDescribeFolderFoldersResult> => {
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
    const folders = await kSemanticModels.folder().getManyByQuery(
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
      (folder): FimidaraPersistedFolderBackendMeta => {
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
    const config = kUtilsInjectables.suppliedConfig();
    let mount = params.mount;

    if (this.backendType === kFimidaraConfigFilePersistenceProvider.s3) {
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

  prepareFileBackendMetaRaw(raw: unknown): FimidaraPersistedFileBackendMetaRaw {
    return {
      backend: this.backendType,
      raw,
    } as FimidaraPersistedFileBackendMetaRaw;
  }

  prepareFolderBackendMetaRaw(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    raw: unknown
  ): FimidaraPersistedFolderBackendMetaRaw {
    return undefined;
  }

  prepareFileBackendMeta(
    meta: PersistedFileBackendMeta<unknown>,
    raw: unknown
  ): FimidaraPersistedFileBackendMeta {
    return {
      ...meta,
      raw: this.prepareFileBackendMetaRaw(raw),
    } as FimidaraPersistedFileBackendMeta;
  }

  prepareFolderBackendMeta(
    meta: PersistedFolderBackendMeta<unknown>,
    raw: unknown
  ): FimidaraPersistedFolderBackendMeta {
    return {
      ...meta,
      raw: this.prepareFolderBackendMetaRaw(raw),
    } as FimidaraPersistedFolderBackendMeta;
  }

  static getBackend = (params: {
    backendType?: FimidaraConfigFilePersistenceProvider;
    getPartStreamForLocalFS: LocalFsFilePersistenceProviderGetPartStream;
  }): FilePersistenceProvider => {
    const config = kUtilsInjectables.suppliedConfig();
    const backendType = params.backendType || config.fileBackend;

    switch (backendType) {
      case kFimidaraConfigFilePersistenceProvider.s3: {
        const s3Config = getAWSS3ConfigFromSuppliedConfig();
        return new S3FilePersistenceProvider(s3Config);
      }

      case kFimidaraConfigFilePersistenceProvider.fs: {
        const {localFsDir, localPartsFsDir} = getLocalFsDirFromSuppliedConfig();
        return new LocalFsFilePersistenceProvider({
          dir: localFsDir,
          partsDir: localPartsFsDir,
          getPartStream: params.getPartStreamForLocalFS,
        });
      }

      case kFimidaraConfigFilePersistenceProvider.memory:
        return new MemoryFilePersistenceProvider();

      default:
        throw kReuseableErrors.file.unknownBackend(backendType || '');
    }
  };
}

function getServerIdForPart(part: FilePart): string {
  appAssert(part.backend === kFileBackendType.fimidara);
  const partRaw = part.raw as FimidaraPersistedFileBackendMetaRaw;

  appAssert(partRaw.backend === kFimidaraConfigFilePersistenceProvider.fs);
  return partRaw.raw.serverId;
}

async function getIpAndPortForServerId(
  serverId: string
): Promise<{ip: string; port: string}> {
  const app = await kSemanticModels
    .app()
    .getLatestAppInstanceForServerId(serverId);

  appAssert(app);
  const ip = app.ipv4 || app.ipv6;
  const httpsPort = app.httpsPort;

  appAssert(ip);
  appAssert(httpsPort);

  return {
    ip,
    port: httpsPort,
  };
}

export async function sysReadPartDistributed(
  params: FilePersistenceCompleteMultipartUploadParams & {
    part: FilePart;
  }
): Promise<NodeJS.ReadableStream> {
  const {workspaceId, filepath, fileId, part, multipartId, mount} = params;
  const serverId = getServerIdForPart(part);
  const {ip, port} = await getIpAndPortForServerId(serverId);
  const url = `https://${ip}:${port}/api/v1/sys/readFile`;
  const body: SysReadFileEndpointParams = {
    workspaceId,
    fileId,
    part: part.part,
    multipartId,
    mountFilepath: filepath,
    mountId: mount.resourceId,
  };

  const {interServerAuthSecret} = kUtilsInjectables.suppliedConfig();
  appAssert(interServerAuthSecret);

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      [kEndpointConstants.headers.interServerAuthSecret]: interServerAuthSecret,
    },
  });

  if (!response.ok || !response.body) {
    throw new ServerError();
  }

  return response.body;
}

export async function sysDeletePartDistributed(
  params: FilePersistenceDeleteMultipartUploadPartParams
) {
  const {workspaceId, filepath, fileId, part, multipartId, mount} = params;
  const serverId = getServerIdForPart(part);
  const {ip, port} = await getIpAndPortForServerId(serverId);
  const url = `https://${ip}:${port}/api/v1/sys/deletePart`;
  const body: SysDeleteFileEndpointParams = {
    workspaceId,
    fileId,
    part: part.part,
    multipartId,
    mountFilepath: filepath,
    mountId: mount.resourceId,
  };

  const {interServerAuthSecret} = kUtilsInjectables.suppliedConfig();
  appAssert(interServerAuthSecret);

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      [kEndpointConstants.headers.interServerAuthSecret]: interServerAuthSecret,
    },
  });

  if (!response.ok) {
    throw new ServerError();
  }
}

export async function sysCleanupMultipartUploadDistributed(
  params: FilePersistenceCleanupMultipartUploadParams & {
    serverId: string;
  }
) {
  const {workspaceId, filepath, fileId, multipartId, mount} = params;
  const {ip, port} = await getIpAndPortForServerId(params.serverId);
  const url = `https://${ip}:${port}/api/v1/sys/deletePart`;
  const body: SysDeleteFileEndpointParams = {
    workspaceId,
    fileId,
    multipartId,
    mountFilepath: filepath,
    mountId: mount.resourceId,
  };

  const {interServerAuthSecret} = kUtilsInjectables.suppliedConfig();
  appAssert(interServerAuthSecret);

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      [kEndpointConstants.headers.interServerAuthSecret]: interServerAuthSecret,
    },
  });

  if (!response.ok) {
    throw new ServerError();
  }
}

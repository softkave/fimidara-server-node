import {isNumber} from 'lodash-es';
import {isObjectEmpty, OmitFrom} from 'softkave-js-utils';
import {Readable} from 'stream';
import {appAssert} from '../../utils/assertion.js';
import {streamToBuffer} from '../../utils/fns.js';
import {
  FilePersistenceCleanupMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadResult,
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDeleteMultipartUploadPartParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
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
  FilePersistenceUploadPartResult,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  IFilePersistenceProviderMount,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from './types.js';
import {defaultToFimidaraPath, defaultToNativePath} from './utils.js';

type MemoryFilePersistenceProviderFile = OmitFrom<
  PersistedFileDescription,
  'filepath' | 'raw'
> & {
  body: Buffer;
  nativePath: string;
};

type MemoryFilePersistenceProviderFilePart = OmitFrom<
  MemoryFilePersistenceProviderFile,
  'body'
> & {
  body: Buffer;
  part: number;
};

export class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  protected files: Record<
    /** workspaceId */ string,
    Record</** nativePath */ string, MemoryFilePersistenceProviderFile>
  > = {};
  protected parts: Record<
    /** workspaceId */ string,
    Record<
      /** multipartId */ string,
      Record</** part */ string, MemoryFilePersistenceProviderFilePart>
    >
  > = {};

  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'describeFile':
      case 'describeFolderContent':
      case 'readFile':
      case 'uploadFile':
        return true;
      case 'deleteFolders':
      case 'describeFolder':
        return false;
    }
  };

  async uploadFile(
    params: FilePersistenceUploadFileParams
  ): Promise<FilePersistenceUploadFileResult> {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({mount, fimidaraPath: filepath});
    const body = await streamToBuffer(params.body);

    if (params.multipartId) {
      appAssert(isNumber(params.part));
      this.addMemoryFilePart(params, {
        body,
        nativePath,
        lastUpdatedAt: Date.now(),
        size: body.byteLength,
        mountId: params.mount.resourceId,
        mimetype: params.mimetype,
        encoding: params.encoding,
      });

      const part: FilePersistenceUploadPartResult = {
        part: params.part,
        multipartId: params.multipartId,
        partId: params.fileId,
      };
      return {filepath, raw: undefined, ...part};
    } else {
      this.setMemoryFile(params, {
        body,
        nativePath,
        lastUpdatedAt: Date.now(),
        size: body.byteLength,
        mountId: params.mount.resourceId,
        mimetype: params.mimetype,
        encoding: params.encoding,
      });

      return {filepath, raw: undefined};
    }
  }

  async completeMultipartUpload(
    params: FilePersistenceCompleteMultipartUploadParams
  ): Promise<FilePersistenceCompleteMultipartUploadResult> {
    this.completeMemoryFile(params);
    return {
      filepath: params.filepath,
      raw: undefined,
    };
  }

  async cleanupMultipartUpload(
    params: FilePersistenceCleanupMultipartUploadParams
  ) {
    await this.internalCleanupMultipartUpload(params);
  }

  async startMultipartUpload(
    params: FilePersistenceStartMultipartUploadParams
  ): Promise<FilePersistenceStartMultipartUploadResult> {
    return {multipartId: params.fileId};
  }

  async deleteMultipartUploadPart(
    params: FilePersistenceDeleteMultipartUploadPartParams
  ) {
    const {part} = params;
    const parts = this.getMemoryFileParts(params);
    delete parts[part];

    if (isObjectEmpty(parts)) {
      this.internalCleanupMultipartUpload(params);
    }
  }

  readFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFile> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {body: Readable.from(file.body), size: file.size};
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    const {mount} = params;
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    params.files.forEach(({filepath: key}) => {
      const {nativePath} = this.toNativePath({mount, fimidaraPath: key});
      delete workspaceFilesMap[nativePath];
    });
  };

  deleteFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDeleteFoldersParams
  ): Promise<void> => {
    // not supported
  };

  dispose = async () => {
    this.files = {};
  };

  describeFile = async (
    params: FilePersistenceDescribeFileParams
  ): Promise<PersistedFileDescription<undefined> | undefined> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        filepath: this.toFimidaraPath({
          nativePath: file.nativePath,
          mount: params.mount,
        }).fimidaraPath,
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
        mountId: params.mount.resourceId,
        raw: undefined,
      };
    }

    return undefined;
  };

  describeFolder = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription<undefined> | undefined> => {
    // not supported
    return undefined;
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<
    FilePersistenceDescribeFolderContentResult<undefined, undefined>
  > => {
    const {mount, folderpath, max, continuationToken} = params;
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    const workspaceFiles = Object.values(workspaceFilesMap);
    const files: PersistedFileDescription<undefined>[] = [];

    if (continuationToken) {
      appAssert(isNumber(continuationToken));
    }

    let index = (continuationToken as number | undefined) || 0;
    const {nativePath: folderNativePath} = this.toNativePath({
      mount,
      fimidaraPath: folderpath,
    });

    for (; index < workspaceFiles.length && files.length < max; index++) {
      const file = workspaceFiles[index];

      if (file.nativePath.startsWith(folderNativePath)) {
        const {fimidaraPath} = this.toFimidaraPath({
          nativePath: file.nativePath,
          mount: mount,
        });

        files.push({
          filepath: fimidaraPath,
          lastUpdatedAt: file.lastUpdatedAt,
          size: file.size,
          mimetype: file.mimetype,
          encoding: file.encoding,
          mountId: mount.resourceId,
          raw: undefined,
        });
      }
    }

    const nextContinuationToken =
      index < workspaceFiles.length - 1 ? index : undefined;
    return {files, continuationToken: nextContinuationToken, folders: []};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult<undefined>> => {
    // not supported
    return {folders: []};
  };

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    const {fimidaraPath, mount} = params;
    const nativePath = defaultToNativePath(mount, fimidaraPath, []);
    return {nativePath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount} = params;
    const fimidaraPath = defaultToFimidaraPath(
      mount,
      nativePath,
      /** preMountedFromPrefix */ []
    );
    return {fimidaraPath};
  };

  getMemoryFile = (params: {
    workspaceId: string;
    filepath: string;
    mount: IFilePersistenceProviderMount;
  }): MemoryFilePersistenceProviderFile | undefined => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({
      fimidaraPath: filepath,
      mount: mount,
    });
    const map = this.getWorkspaceFiles(params);
    return map[nativePath];
  };

  protected getWorkspaceFiles = (params: {workspaceId: string}) => {
    let map = this.files[params.workspaceId];
    if (!map) {
      map = this.files[params.workspaceId] = {};
    }

    return map;
  };

  protected getWorkspaceFileParts = (params: {workspaceId: string}) => {
    let map = this.parts[params.workspaceId];
    if (!map) {
      map = this.parts[params.workspaceId] = {};
    }

    return map;
  };

  protected getMemoryFileParts = (params: {
    workspaceId: string;
    multipartId: string;
  }) => {
    const map = this.getWorkspaceFileParts(params);
    let parts = map[params.multipartId];
    if (!parts) {
      parts = map[params.multipartId] = {};
    }

    return parts;
  };

  protected internalCleanupMultipartUpload = (params: {
    workspaceId: string;
    multipartId: string;
  }) => {
    const {multipartId} = params;
    const map = this.getWorkspaceFileParts(params);
    delete map[multipartId];
  };

  protected setMemoryFile = (
    params: {workspaceId: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const map = this.getWorkspaceFiles(params);
    map[file.nativePath] = file;
  };

  protected addMemoryFilePart = (
    params: FilePersistenceUploadFileParams,
    file: MemoryFilePersistenceProviderFile
  ) => {
    appAssert(isNumber(params.part));
    appAssert(params.multipartId);
    const parts = this.getMemoryFileParts({
      workspaceId: params.workspaceId,
      multipartId: params.multipartId,
    });
    parts[params.part] = {
      ...file,
      part: params.part,
    };
  };

  protected completeMemoryFile = (
    params: Pick<FilePersistenceUploadFileParams, 'workspaceId' | 'multipartId'>
  ) => {
    appAssert(params.multipartId);
    const partsMap = this.getMemoryFileParts({
      workspaceId: params.workspaceId,
      multipartId: params.multipartId,
    });
    const parts = Object.values(partsMap).sort((a, b) => a.part - b.part);
    const assembled = parts.reduce(
      (acc, part): MemoryFilePersistenceProviderFile => {
        return {
          ...acc,
          body: Buffer.concat([acc.body || Buffer.alloc(0), part.body]),
          nativePath: part.nativePath,
          lastUpdatedAt: Date.now(),
          size: (acc.body?.byteLength || 0) + part.body.byteLength,
          mountId: part.mountId,
          mimetype: part.mimetype,
          encoding: part.encoding,
        };
      },
      {} as Partial<MemoryFilePersistenceProviderFile>
    );

    const file = assembled as MemoryFilePersistenceProviderFile;
    this.setMemoryFile(params, file as MemoryFilePersistenceProviderFile);
    this.internalCleanupMultipartUpload({
      workspaceId: params.workspaceId,
      multipartId: params.multipartId,
    });
  };
}

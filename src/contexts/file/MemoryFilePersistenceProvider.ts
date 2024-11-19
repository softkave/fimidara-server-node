import {isNumber} from 'lodash-es';
import {OmitFrom} from 'softkave-js-utils';
import {Readable} from 'stream';
import {FileBackendMount} from '../../definitions/fileBackend.js';
import {appAssert} from '../../utils/assertion.js';
import {streamToBuffer} from '../../utils/fns.js';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
  FilePersistenceDescribeFileParams,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
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
} from './types.js';
import {defaultToFimidaraPath, defaultToNativePath} from './utils.js';

type MemoryFilePersistenceProviderFile = OmitFrom<
  PersistedFileDescription,
  'filepath' | 'raw'
> & {
  body: Buffer;
  nativePath: string;
};

type MemoryFilePersistenceProviderFilePart = {
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
    Record</** nativePath */ string, MemoryFilePersistenceProviderFilePart>
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

  async uploadFile(params: FilePersistenceUploadFileParams) {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({mount, fimidaraPath: filepath});
    const body = await streamToBuffer(params.body);

    if (isNumber(params.part)) {
      this.addMemoryFilePart(params, {body, nativePath});
      if (params.isLastPart) {
        this.completeMemoryFile(params, {
          nativePath,
          lastUpdatedAt: Date.now(),
          size: body.byteLength,
          mountId: params.mount.resourceId,
          mimetype: params.mimetype,
          encoding: params.encoding,
        });
      }

      return {filepath, raw: undefined};
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
    mount: FileBackendMount;
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

  protected setMemoryFile = (
    params: {workspaceId: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const map = this.getWorkspaceFiles(params);
    map[file.nativePath] = file;
  };

  protected addMemoryFilePart = (
    params: FilePersistenceUploadFileParams,
    file: Pick<MemoryFilePersistenceProviderFile, 'body' | 'nativePath'>
  ) => {
    appAssert(isNumber(params.part));
    const map = this.getWorkspaceFileParts(params);
    map[file.nativePath] = {
      body: file.body,
      part: params.part,
    };
  };

  protected completeMemoryFile = (
    params: FilePersistenceUploadFileParams,
    file: OmitFrom<MemoryFilePersistenceProviderFile, 'body'>
  ) => {
    const map = this.getWorkspaceFileParts(params);
    const parts = Object.values(map).sort((a, b) => a.part - b.part);
    const body = Buffer.concat(parts.map(part => part.body));
    this.setMemoryFile(params, {
      ...file,
      body,
    });

    delete map[file.nativePath];
  };
}

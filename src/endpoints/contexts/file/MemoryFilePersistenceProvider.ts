import {isNumber} from 'lodash';
import {Readable} from 'stream';
import {FileBackendMount} from '../../../definitions/fileBackend';
import {appAssert} from '../../../utils/assertion';
import {streamToBuffer} from '../../../utils/fns';
import {OmitProperties} from '../../../utils/types';
import {
  FilePersistenceDeleteFilesParams,
  FilePersistenceDeleteFoldersParams,
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
} from './types';
import {defaultToFimidaraPath, defaultToNativePath} from './utils';

type MemoryFilePersistenceProviderFile = OmitProperties<
  PersistedFileDescription,
  'filepath'
> & {
  body: Buffer;
  nativePath: string;
};

export class MemoryFilePersistenceProvider implements FilePersistenceProvider {
  files: Record<
    /** workspaceId */ string,
    Record</** nativePath */ string, MemoryFilePersistenceProviderFile>
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
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    const body = await streamToBuffer(params.body);

    this.setMemoryFile(params, {
      body,
      nativePath,
      lastUpdatedAt: Date.now(),
      size: body.byteLength,
      mountId: params.mount.resourceId,
      mimetype: params.mimetype,
      encoding: params.encoding,
    });

    return {};
  }

  readFile = async (params: FilePersistenceGetFileParams): Promise<PersistedFile> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        body: Readable.from(file.body),
        size: file.size,
      };
    }

    return {body: undefined};
  };

  deleteFiles = async (params: FilePersistenceDeleteFilesParams) => {
    const {mount} = params;
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    params.filepaths.forEach(key => {
      const {nativePath} = this.toNativePath({mount, fimidaraPath: key});
      delete workspaceFilesMap[nativePath];
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteFolders = async (params: FilePersistenceDeleteFoldersParams): Promise<void> => {
    // not supported
  };

  dispose = async () => {
    this.files = {};
  };

  describeFile = async (
    params: FilePersistenceGetFileParams
  ): Promise<PersistedFileDescription | undefined> => {
    const file = this.getMemoryFile(params);

    if (file) {
      return {
        filepath: this.toFimidaraPath({nativePath: file.nativePath, mount: params.mount})
          .fimidaraPath,
        lastUpdatedAt: file.lastUpdatedAt,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
        mountId: params.mount.resourceId,
      };
    }

    return undefined;
  };

  describeFolder = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderParams
  ): Promise<PersistedFolderDescription | undefined> => {
    // not supported
    return undefined;
  };

  describeFolderContent = async (
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult> => {
    const {mount, folderpath, max, continuationToken} = params;
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    const workspaceFiles = Object.values(workspaceFilesMap);
    const files: PersistedFileDescription[] = [];

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
        });
      }
    }

    const nextContinuationToken = index < workspaceFiles.length - 1 ? index : undefined;
    return {files, continuationToken: nextContinuationToken, folders: []};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    // not supported
    return {folders: []};
  };

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    const {fimidaraPath, mount, postMountedFromPrefix} = params;
    const nativePath = defaultToNativePath(
      mount,
      fimidaraPath,
      [],
      postMountedFromPrefix
    );
    return {nativePath};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    const {nativePath, mount, postMountedFromPrefix} = params;
    const fimidaraPath = defaultToFimidaraPath(
      mount,
      nativePath,
      [],
      postMountedFromPrefix
    );
    return {fimidaraPath};
  };

  getWorkspaceFiles = (params: {workspaceId: string}) => {
    let workspaceFilesMap = this.files[params.workspaceId];

    if (!workspaceFilesMap) {
      workspaceFilesMap = this.files[params.workspaceId] = {};
    }

    return workspaceFilesMap;
  };

  setMemoryFile = (
    params: {workspaceId: string},
    file: MemoryFilePersistenceProviderFile
  ) => {
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    workspaceFilesMap[file.nativePath] = file;
  };

  getMemoryFile = (params: {
    workspaceId: string;
    filepath: string;
    mount: FileBackendMount;
  }): MemoryFilePersistenceProviderFile | undefined => {
    const {mount, filepath} = params;
    const {nativePath} = this.toNativePath({fimidaraPath: filepath, mount: mount});
    const workspaceFilesMap = this.getWorkspaceFiles(params);
    return workspaceFilesMap[nativePath];
  };
}

import {
  FilePersistenceCompleteMultipartUploadParams,
  FilePersistenceCompleteMultipartUploadResult,
  FilePersistenceDescribeFolderContentParams,
  FilePersistenceDescribeFolderContentResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderFoldersResult,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  FilePersistenceStartMultipartUploadResult,
  FilePersistenceToFimidaraPathParams,
  FilePersistenceToFimidaraPathResult,
  FilePersistenceUploadFileParams,
  FimidaraToFilePersistencePathParams,
  FimidaraToFilePersistencePathResult,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../../contexts/file/types.js';
import {noopAsync} from '../../../../utils/fns.js';

export default class NoopFilePersistenceProviderContext
  implements FilePersistenceProvider
{
  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
      case 'deleteFolders':
      case 'describeFile':
      case 'describeFolder':
      case 'describeFolderContent':
      case 'readFile':
      case 'uploadFile':
        return false;
    }
  };

  readFile = async (): Promise<PersistedFile> => {
    return {body: undefined};
  };

  deleteFiles = noopAsync;
  deleteFolders = noopAsync;
  dispose = noopAsync;
  cleanupMultipartUpload = noopAsync;
  deleteMultipartUploadPart = noopAsync;

  completeMultipartUpload = async (
    params: FilePersistenceCompleteMultipartUploadParams
  ): Promise<FilePersistenceCompleteMultipartUploadResult> => {
    return {
      filepath: params.filepath,
      raw: undefined,
    };
  };

  startMultipartUpload =
    async (): Promise<FilePersistenceStartMultipartUploadResult> => {
      return {multipartId: ''};
    };

  describeFile = async (): Promise<PersistedFileDescription | undefined> => {
    return undefined;
  };

  describeFolder = async (): Promise<
    PersistedFolderDescription | undefined
  > => {
    return undefined;
  };

  uploadFile = async (params: FilePersistenceUploadFileParams) => ({
    filepath: params.filepath,
    raw: undefined,
  });

  describeFolderContent = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderContentParams
  ): Promise<FilePersistenceDescribeFolderContentResult> => {
    return {files: [], folders: []};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    return {folders: []};
  };

  toFimidaraPath = (
    params: FilePersistenceToFimidaraPathParams
  ): FilePersistenceToFimidaraPathResult => {
    return {fimidaraPath: params.nativePath};
  };

  toNativePath = (
    params: FimidaraToFilePersistencePathParams
  ): FimidaraToFilePersistencePathResult => {
    return {nativePath: params.fimidaraPath};
  };
}

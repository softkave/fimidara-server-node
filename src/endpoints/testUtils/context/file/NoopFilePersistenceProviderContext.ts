import {
  FilePersistenceDescribeFolderFilesParams,
  FilePersistenceDescribeFolderFilesResult,
  FilePersistenceDescribeFolderFoldersParams,
  FilePersistenceDescribeFolderFoldersResult,
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
  PersistedFile,
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../../../contexts/file/types';

export default class NoopFilePersistenceProviderContext
  implements FilePersistenceProvider
{
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
        return false;
    }
  };

  readFile = async (): Promise<PersistedFile> => {
    return {body: undefined};
  };

  deleteFiles = async () => {};
  deleteFolders = async (): Promise<void> => {};
  dispose = async () => {};

  describeFile = async (): Promise<PersistedFileDescription | undefined> => {
    return undefined;
  };

  describeFolder = async (): Promise<PersistedFolderDescription | undefined> => {
    return undefined;
  };

  uploadFile = async () => ({});
  describeFolderFiles = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFilesParams
  ): Promise<FilePersistenceDescribeFolderFilesResult> => {
    return {files: []};
  };

  describeFolderFolders = async (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params: FilePersistenceDescribeFolderFoldersParams
  ): Promise<FilePersistenceDescribeFolderFoldersResult> => {
    return {folders: []};
  };
}

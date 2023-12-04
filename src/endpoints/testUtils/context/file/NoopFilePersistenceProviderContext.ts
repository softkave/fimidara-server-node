import {noopAsync} from '../../../../utils/fns';
import {
  FilePersistenceProvider,
  FilePersistenceProviderFeature,
} from '../../../contexts/file/types';

export default class NoopFilePersistenceProviderContext
  implements FilePersistenceProvider
{
  supportsFeature = (feature: FilePersistenceProviderFeature): boolean => {
    switch (feature) {
      case 'deleteFiles':
        return false;
      case 'deleteFolders':
        return false;
      case 'describeFile':
        return false;
      case 'describeFolder':
        return false;
      case 'describeFolderFiles':
        return false;
      case 'describeFolderFolders':
        return false;
      case 'readFile':
        return false;
      case 'uploadFile':
        return false;
    }
  };

  uploadFile = async () => ({});
  readFile = async () => ({});
  deleteFiles = noopAsync;
  deleteFolders = noopAsync;
  describeFile = async () => {
    return undefined;
  };
  describeFolder = async () => {
    return undefined;
  };
  describeFolderFiles = async () => {
    return {files: []};
  };
  describeFolderFolders = async () => {
    return {folders: []};
  };
  close = noopAsync;
}

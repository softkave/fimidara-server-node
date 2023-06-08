import {noopAsync} from '../../../utils/fns';
import {FilePersistenceProviderContext} from '../../contexts/file/types';

export default class NoopFilePersistenceProviderContext implements FilePersistenceProviderContext {
  uploadFile = noopAsync;
  getFile = async () => {
    return {};
  };
  deleteFiles = noopAsync;
  ensureBucketReady = noopAsync;
  close = noopAsync;
}

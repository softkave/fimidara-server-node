import {noopAsync} from '../../../utils/fns';
import {FilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';

export default class NoopFilePersistenceProviderContext implements FilePersistenceProviderContext {
  uploadFile = noopAsync;
  getFile = async () => {
    return {};
  };
  deleteFiles = noopAsync;
  ensureBucketReady = noopAsync;
  close = noopAsync;
}

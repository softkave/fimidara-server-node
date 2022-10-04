import {noopAsync} from '../../../utilities/fns';
import {IFilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';

export default class NoopFilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  uploadFile = noopAsync;
  getFile = async () => {
    return {};
  };
  deleteFiles = noopAsync;
  ensureBucketReady = noopAsync;
  close = noopAsync;
}

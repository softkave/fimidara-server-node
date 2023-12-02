import {noopAsync} from '../../../utils/fns';
import {FilePersistenceProvider} from '../../contexts/file/types';

export default class NoopFilePersistenceProviderContext
  implements FilePersistenceProvider
{
  uploadFile = noopAsync;
  readFile = async () => ({});
  deleteFiles = noopAsync;
  ensureBucketReady = noopAsync;
  close = noopAsync;
}

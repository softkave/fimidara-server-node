import {noopAsync} from '../../../utilities/fns';
import {IFilePersistenceProviderContext} from '../../contexts/FilePersistenceProviderContext';

export default class NoopFilePersistenceProviderContext
  implements IFilePersistenceProviderContext
{
  public uploadFile = noopAsync;
  public getFile = async () => {
    return {};
  };
  public deleteFiles = noopAsync;
  public ensureBucketReady = noopAsync;
  public close = noopAsync;
}

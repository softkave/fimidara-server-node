import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderTxnOptions} from '../types';
import {SemanticResolvedMountEntryProvider} from './types';

export class DataSemanticResolvedMountEntry
  extends DataSemanticWorkspaceResourceProvider<ResolvedMountEntry>
  implements SemanticResolvedMountEntryProvider
{
  getMountEntries = (
    mountId: string,
    opts?: SemanticProviderTxnOptions
  ): Promise<ResolvedMountEntry[]> => {
    return this.data.getManyByQuery({mountId}, opts);
  };
}

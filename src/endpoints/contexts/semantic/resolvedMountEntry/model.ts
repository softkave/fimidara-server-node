import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {DataQuery} from '../../data/types';
import {addIsDeletedIntoQuery} from '../DataSemanticDataAccessBaseProvider';
import {DataSemanticWorkspaceResourceProvider} from '../DataSemanticDataAccessWorkspaceResourceProvider';
import {SemanticProviderQueryListParams} from '../types';
import {SemanticResolvedMountEntryProvider} from './types';

export class DataSemanticResolvedMountEntry
  extends DataSemanticWorkspaceResourceProvider<ResolvedMountEntry>
  implements SemanticResolvedMountEntryProvider
{
  getMountEntries = (
    mountId: string,
    opts?: SemanticProviderQueryListParams<ResolvedMountEntry>
  ): Promise<ResolvedMountEntry[]> => {
    const query = addIsDeletedIntoQuery<DataQuery<ResolvedMountEntry>>(
      {mountId},
      opts?.includeDeleted || false
    );
    return this.data.getManyByQuery(query, opts);
  };
}

import {App} from '../../../definitions/app';
import {FileBackendMount, ResolvedMountEntry} from '../../../definitions/fileBackend';
import {Job} from '../../../definitions/job';
import {DataSemanticWorkspaceResourceProvider} from './DataSemanticDataAccessWorkspaceResourceProvider';
import {
  SemanticAppProvider,
  SemanticFileBackendMountProvider,
  SemanticJobProvider,
  SemanticProviderRunOptions,
  SemanticResolvedMountEntryProvider,
} from './types';

export class DataSemanticFileBackendMount
  extends DataSemanticWorkspaceResourceProvider<FileBackendMount>
  implements SemanticFileBackendMountProvider {}

export class DataSemanticApp
  extends DataSemanticWorkspaceResourceProvider<App>
  implements SemanticAppProvider {}

export class DataSemanticJob
  extends DataSemanticWorkspaceResourceProvider<Job>
  implements SemanticJobProvider {}

export class DataSemanticResolvedMountEntry
  extends DataSemanticWorkspaceResourceProvider<ResolvedMountEntry>
  implements SemanticResolvedMountEntryProvider
{
  getMountEntries = (
    mountId: string,
    opts?: SemanticProviderRunOptions
  ): Promise<ResolvedMountEntry[]> => {
    return this.data.getManyByQuery({mountId}, opts);
  };
}

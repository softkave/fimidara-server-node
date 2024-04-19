import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {
  SemanticProviderQueryListParams,
  SemanticWorkspaceResourceProviderType,
} from '../types';

export type SemanticResolvedMountEntryProvider =
  SemanticWorkspaceResourceProviderType<ResolvedMountEntry> & {
    getMountEntries: (
      mountId: string,
      opts?: SemanticProviderQueryListParams<ResolvedMountEntry>
    ) => Promise<ResolvedMountEntry[]>;
  };

import {ResolvedMountEntry} from '../../../../definitions/fileBackend';
import {
  SemanticWorkspaceResourceProviderType,
  SemanticProviderTxnOptions,
} from '../types';

export type SemanticResolvedMountEntryProvider =
  SemanticWorkspaceResourceProviderType<ResolvedMountEntry> & {
    getMountEntries: (
      mountId: string,
      opts?: SemanticProviderTxnOptions
    ) => Promise<ResolvedMountEntry[]>;
  };

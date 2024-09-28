import {ResolvedMountEntry} from '../../../definitions/fileBackend.js';
import {
  SemanticProviderQueryParams,
  SemanticWorkspaceResourceProviderType,
} from '../types.js';

export type SemanticResolvedMountEntryProvider =
  SemanticWorkspaceResourceProviderType<ResolvedMountEntry> & {
    getOneByMountIdAndFileId: (
      mountId: string,
      fileId: string,
      opts?: SemanticProviderQueryParams<ResolvedMountEntry>
    ) => Promise<ResolvedMountEntry | null>;
    getLatestByFimidaraNamepathAndExt: (
      workspaceId: string,
      fimidaraNamepath: string[],
      fimidaraExt: string | undefined,
      opts?: SemanticProviderQueryParams<ResolvedMountEntry>
    ) => Promise<ResolvedMountEntry[]>;
    getLatestByForId: (
      forId: string,
      opts?: SemanticProviderQueryParams<ResolvedMountEntry>
    ) => Promise<ResolvedMountEntry[]>;
    getLatestForManyFimidaraNamepathAndExt: (
      workspaceId: string,
      entries: Array<{fimidaraNamepath: string[]; fimidaraExt?: string}>,
      opts?: SemanticProviderQueryParams<ResolvedMountEntry>
    ) => Promise<ResolvedMountEntry[]>;
  };

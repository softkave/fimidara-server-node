import {ObjectValues} from '../utils/types';
import {
  AppResourceType,
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export const FileBackendTypeMap = {
  Fimidara: 'fimidara',
  S3: 'aws-s3',
} as const;

export type FileBackendType = ObjectValues<typeof FileBackendTypeMap>;

export interface FileBackendMount extends WorkspaceResource {
  /** folderpath without workspace rootname */
  folderpath: string[];
  /** Preferred backend mount for file or folder look up when multiple backends
   * are mounted to the same folderpath */
  index: number;
  /** string array of + bucket? + folderpath? */
  mountedFrom: string[];
  backend: FileBackendType;
  configId: string | null;
  name: string;
  description?: string;
}

export interface FileBackendConfig extends WorkspaceResource {
  name: string;
  description?: string;
  backend: FileBackendType;
  secretId: string;
}

export interface ResolvedMountEntry extends WorkspaceResource {
  mountId: string;
  resolvedAt: number;
  resolvedFor: string;
  resolvedForType: AppResourceType;
}

export type PublicFileBackendMount = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<
      FileBackendMount,
      | 'folderpath'
      | 'index'
      | 'mountedFrom'
      | 'backend'
      | 'name'
      | 'description'
      | 'configId'
    >
  >;

export type PublicFileBackendConfig = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<Pick<FileBackendConfig, 'backend' | 'name' | 'description'>>;

export type PublicResolvedMountEntry = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<Pick<ResolvedMountEntry, 'mountId' | 'resolvedAt'>>;

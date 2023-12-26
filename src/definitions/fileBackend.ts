import {ObjectValues} from '../utils/types';
import {
  AppResourceType,
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export const kFileBackendType = {
  Fimidara: 'fimidara',
  S3: 'aws-s3',
} as const;

export type FileBackendType = ObjectValues<typeof kFileBackendType>;

export interface FileBackendMount extends WorkspaceResource {
  // TODO: is there any advantage to having folderpath and mountedFrom as string
  // arrays? If not, make them string
  /** folderpath without workspace rootname */
  folderpath: string[];
  /** string array of + bucket? + folderpath? */
  mountedFrom: string[];
  /** Preferred backend mount for file or folder look up when multiple backends
   * are mounted to the same folderpath */
  index: number;
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
  namepath: string[];
  extension?: string;
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
  ConvertAgentToPublicAgent<
    Pick<
      ResolvedMountEntry,
      'mountId' | 'resolvedAt' | 'namepath' | 'extension' | 'resolvedForType'
    >
  >;

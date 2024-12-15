import {ValueOf} from 'type-fest';
import {
  PersistedFileDescription,
  PersistedFolderDescription,
} from '../contexts/file/types.js';
import {
  FimidaraResourceType,
  PublicWorkspaceResource,
  ToPublicDefinitions,
  WorkspaceResource,
} from './system.js';

export const kFileBackendType = {
  fimidara: 'fimidara',
  s3: 'aws-s3',
} as const;

export type FileBackendType = ValueOf<typeof kFileBackendType>;

export interface FileBackendMount extends WorkspaceResource {
  // TODO: is there any advantage to having folderpath and mountedFrom as string
  // arrays? If not, make them string
  /** folderpath without workspace rootname */
  namepath: string[];
  /** string array of "bucket? + folderpath?" */
  mountedFrom: string[];
  /** Preferred backend mount for file or folder look up when multiple backends
   * are mounted to the same folderpath. Higher values have higher weight. */
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
  backendNamepath: string[];
  backendExt?: string;
  fimidaraNamepath: string[];
  fimidaraExt?: string;
  /** Resource ID */
  forId: string;
  /** Resource type */
  forType: FimidaraResourceType;
  persisted: PersistedFileDescription | PersistedFolderDescription;
}

export type PublicFileBackendMount = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      FileBackendMount,
      | 'namepath'
      | 'index'
      | 'mountedFrom'
      | 'backend'
      | 'name'
      | 'description'
      | 'configId'
    >
  >;

export type PublicFileBackendConfig = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<FileBackendConfig, 'backend' | 'name' | 'description'>
  >;

export type PublicResolvedMountEntry = PublicWorkspaceResource &
  ToPublicDefinitions<
    Pick<
      ResolvedMountEntry,
      | 'mountId'
      | 'backendNamepath'
      | 'backendExt'
      | 'fimidaraNamepath'
      | 'fimidaraExt'
      | 'forType'
      | 'forId'
    >
  >;

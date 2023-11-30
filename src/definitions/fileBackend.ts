import {ObjectValues} from '../utils/types';
import {
  ConvertAgentToPublicAgent,
  PublicWorkspaceResource,
  WorkspaceResource,
} from './system';

export const FileBackendTypeMap = {
  Fimidara: 'fimidara',
} as const;

export const FileBackendProductTypeMap = {
  Fimidara: 'fimidara',
  S3: 'aws-s3',
} as const;

export type FileBackendType = ObjectValues<typeof FileBackendTypeMap>;
export type FileBackendProductType = ObjectValues<typeof FileBackendProductTypeMap>;
export type FilePersistenceType = Exclude<
  FileBackendProductType,
  typeof FileBackendProductTypeMap.Fimidara
>;

export interface FileBackendMount extends WorkspaceResource {
  /** folderpath without workspace rootname */
  folderpath: string[];
  /** Preferred backend mount for file or folder look up when multiple backends
   * are mounted to the same folderpath */
  index: number;
  /** string array of backend product + bucket? + folderpath? */
  mountedFrom: string[];
  product: FileBackendProductType;
  configId: string;
  name: string;
  description?: string;
}

export interface FileBackendConfig extends WorkspaceResource {
  name: string;
  description?: string;
  type: FileBackendType;
  /** Encrypted JSON string */
  credentials: string;
  cipher: string;
}

export type PublicFileBackendMount = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<
    Pick<
      FileBackendMount,
      'folderpath' | 'index' | 'mountedFrom' | 'product' | 'name' | 'description'
    >
  >;

export type PublicFileBackendConfig = PublicWorkspaceResource &
  ConvertAgentToPublicAgent<Pick<FileBackendConfig, 'type'>>;

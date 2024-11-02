import {
  FileBackendType,
  PublicFileBackendMount,
} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface NewFileBackendMountInput {
  folderpath: string;
  index: number;
  mountedFrom: string;
  backend: FileBackendType;
  /** `null` for fimidara */
  configId: string | null;
  name: string;
  description?: string;
}

export interface AddFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    NewFileBackendMountInput {}

export interface AddFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type AddFileBackendMountEndpoint = Endpoint<
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult
>;

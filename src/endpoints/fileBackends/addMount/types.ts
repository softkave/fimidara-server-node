import {FileBackendType, PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface NewFileBackendMountInput {
  folderpath: string[];
  index: number;
  mountedFrom: string[];
  backend: FileBackendType;
  /** `null` for fimidara */
  configId: string | null;
  name: string;
  description?: string;
}

export interface AddFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  mount: NewFileBackendMountInput;
}

export interface AddFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type AddFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult
>;

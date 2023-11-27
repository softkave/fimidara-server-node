import {
  FileBackendProductType,
  FileBackendType,
  PublicFileBackendMount,
} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface AddFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  folderpath: string[];
  index: number;
  mountedFrom: string[];
  product: FileBackendProductType;
  type: FileBackendType;
  configId: string;
}

export interface AddFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type AddFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  AddFileBackendMountEndpointParams,
  AddFileBackendMountEndpointResult
>;

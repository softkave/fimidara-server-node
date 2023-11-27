import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface GetFileBackendMountEndpointParams
  extends EndpointWorkspaceResourceParam {
  mountId: string;
}

export interface GetFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type GetFileBackendMountEndpoint = Endpoint<
  BaseContextType,
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult
>;

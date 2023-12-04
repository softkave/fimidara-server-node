import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface GetFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
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

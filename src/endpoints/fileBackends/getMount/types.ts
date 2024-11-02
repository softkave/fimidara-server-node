import {PublicFileBackendMount} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  mountId: string;
}

export interface GetFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type GetFileBackendMountEndpoint = Endpoint<
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult
>;

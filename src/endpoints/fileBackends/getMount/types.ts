import {PublicFileBackendMount} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface GetFileBackendMountEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  mountId: string;
}

export interface GetFileBackendMountEndpointResult {
  mount: PublicFileBackendMount;
}

export type GetFileBackendMountEndpoint = Endpoint<
  GetFileBackendMountEndpointParams,
  GetFileBackendMountEndpointResult
>;

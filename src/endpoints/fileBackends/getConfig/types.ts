import {PublicFileBackendConfig} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface GetFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  configId: string;
}

export interface GetFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type GetFileBackendConfigEndpoint = Endpoint<
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult
>;

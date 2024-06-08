import {PublicFileBackendConfig} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface GetFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  configId: string;
}

export interface GetFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type GetFileBackendConfigEndpoint = Endpoint<
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult
>;

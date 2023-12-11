import {PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

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

import {PublicFileBackendConfig} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export type UpdateFileBackendConfigInput = {
  credentials?: Record<string, unknown>;
  name?: string;
  description?: string;
};

export type UpdateFileBackendConfigEndpointParams =
  EndpointOptionalWorkspaceIdParam & {
    config: UpdateFileBackendConfigInput;
    configId: string;
  };

export interface UpdateFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type UpdateFileBackendConfigEndpoint = Endpoint<
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult
>;

import {PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export type UpdateFileBackendConfigInput = {
  credentials?: Record<string, unknown>;
  name?: string;
  description?: string;
};

export type UpdateFileBackendConfigEndpointParams = EndpointOptionalWorkspaceIDParam & {
  config: UpdateFileBackendConfigInput;
  configId: string;
};

export interface UpdateFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type UpdateFileBackendConfigEndpoint = Endpoint<
  BaseContextType,
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigEndpointResult
>;

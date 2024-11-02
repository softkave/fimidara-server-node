import {
  FileBackendType,
  PublicFileBackendConfig,
} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface NewFileBackendConfigInput {
  backend: FileBackendType;
  credentials: Record<string, unknown>;
  name: string;
  description?: string;
}

export interface AddFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    NewFileBackendConfigInput {}

export interface AddFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type AddFileBackendConfigEndpoint = Endpoint<
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult
>;

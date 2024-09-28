import {
  FileBackendType,
  PublicFileBackendConfig,
} from '../../../definitions/fileBackend.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface NewFileBackendConfigInput {
  backend: FileBackendType;
  credentials: Record<string, unknown>;
  name: string;
  description?: string;
}

export interface AddFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam,
    NewFileBackendConfigInput {}

export interface AddFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type AddFileBackendConfigEndpoint = Endpoint<
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult
>;

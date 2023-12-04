import {FileBackendType, PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface NewFileBackendConfigInput {
  backend: FileBackendType;
  credentials: Record<string, unknown>;
  name: string;
  description?: string;
}

export interface AddFileBackendConfigEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  config: NewFileBackendConfigInput;
}

export interface AddFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type AddFileBackendConfigEndpoint = Endpoint<
  BaseContextType,
  AddFileBackendConfigEndpointParams,
  AddFileBackendConfigEndpointResult
>;

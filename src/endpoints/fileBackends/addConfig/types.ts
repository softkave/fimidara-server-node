import {FileBackendType, PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface NewConfigInput {
  type: FileBackendType;
  credentials: Record<string, unknown>;
  name: string;
  description?: string;
}

export interface AddConfigEndpointParams extends EndpointOptionalWorkspaceIDParam {
  config: NewConfigInput;
}

export interface AddConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type AddConfigEndpoint = Endpoint<
  BaseContextType,
  AddConfigEndpointParams,
  AddConfigEndpointResult
>;

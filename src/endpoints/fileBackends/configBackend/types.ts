import {FileBackendType, PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface ConfigFileBackendEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  type: FileBackendType;
  credentials: Record<string, unknown>;
}

export interface ConfigFileBackendEndpointResult {
  config: PublicFileBackendConfig;
}

export type ConfigFileBackendEndpoint = Endpoint<
  BaseContextType,
  ConfigFileBackendEndpointParams,
  ConfigFileBackendEndpointResult
>;

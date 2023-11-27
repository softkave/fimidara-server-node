import {PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {Endpoint, EndpointWorkspaceResourceParam} from '../../types';

export interface GetFileBackendConfigEndpointParams
  extends EndpointWorkspaceResourceParam {
  configId: string;
}

export interface GetFileBackendConfigEndpointResult {
  config: PublicFileBackendConfig;
}

export type GetFileBackendConfigEndpoint = Endpoint<
  BaseContextType,
  GetFileBackendConfigEndpointParams,
  GetFileBackendConfigEndpointResult
>;

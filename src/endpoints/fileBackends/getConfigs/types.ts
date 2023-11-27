import {PublicFileBackendConfig} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export type GetFileBackendConfigsEndpointParamsBase = EndpointOptionalWorkspaceIDParam;

export interface GetFileBackendConfigsEndpointParams
  extends GetFileBackendConfigsEndpointParamsBase,
    PaginationQuery {}

export interface GetFileBackendConfigsEndpointResult extends PaginatedResult {
  configs: PublicFileBackendConfig[];
}

export type GetFileBackendConfigsEndpoint = Endpoint<
  BaseContextType,
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointResult
>;

import {
  FileBackendType,
  PublicFileBackendConfig,
} from '../../../definitions/fileBackend.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export type GetFileBackendConfigsEndpointParamsBase =
  EndpointOptionalWorkspaceIdParam & {
    backend?: FileBackendType;
  };

export interface GetFileBackendConfigsEndpointParams
  extends GetFileBackendConfigsEndpointParamsBase,
    PaginationQuery {}

export interface GetFileBackendConfigsEndpointResult extends PaginatedResult {
  configs: PublicFileBackendConfig[];
}

export type GetFileBackendConfigsEndpoint = Endpoint<
  GetFileBackendConfigsEndpointParams,
  GetFileBackendConfigsEndpointResult
>;

import {FileBackendType, PublicFileBackendConfig} from '../../../definitions/fileBackend.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export type GetFileBackendConfigsEndpointParamsBase = EndpointOptionalWorkspaceIDParam & {
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

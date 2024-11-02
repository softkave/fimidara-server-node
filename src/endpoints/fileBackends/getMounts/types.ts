import {
  FileBackendType,
  PublicFileBackendMount,
} from '../../../definitions/fileBackend.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export type GetFileBackendMountsEndpointParamsBase =
  EndpointOptionalWorkspaceIdParam & {
    folderpath?: string;
    backend?: FileBackendType;
    configId?: string;
  };

export interface GetFileBackendMountsEndpointParams
  extends GetFileBackendMountsEndpointParamsBase,
    PaginationQuery {}

export interface GetFileBackendMountsEndpointResult extends PaginatedResult {
  mounts: PublicFileBackendMount[];
}

export type GetFileBackendMountsEndpoint = Endpoint<
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointResult
>;

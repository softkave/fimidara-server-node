import {PublicFileBackendMount} from '../../../definitions/fileBackend';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export type GetFileBackendMountsEndpointParamsBase = EndpointOptionalWorkspaceIDParam;

export interface GetFileBackendMountsEndpointParams
  extends GetFileBackendMountsEndpointParamsBase,
    PaginationQuery {}

export interface GetFileBackendMountsEndpointResult extends PaginatedResult {
  mounts: PublicFileBackendMount[];
}

export type GetFileBackendMountsEndpoint = Endpoint<
  BaseContextType,
  GetFileBackendMountsEndpointParams,
  GetFileBackendMountsEndpointResult
>;

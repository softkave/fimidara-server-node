import {PublicTag} from '../../../definitions/tag.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspaceTagsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetWorkspaceTagsEndpointParams
  extends GetWorkspaceTagsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceTagsEndpointResult extends PaginatedResult {
  tags: PublicTag[];
}

export type GetWorkspaceTagsEndpoint = Endpoint<
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult
>;

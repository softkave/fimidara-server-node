import {PublicTag} from '../../../definitions/tag';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetWorkspaceTagsEndpointParamsBase
  extends EndpointOptionalWorkspaceIDParam {}

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

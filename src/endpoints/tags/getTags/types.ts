import {PublicTag} from '../../../definitions/tag.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetTagsEndpointParamsBase
  extends EndpointOptionalWorkspaceIdParam {}

export interface GetTagsEndpointParams
  extends GetTagsEndpointParamsBase,
    PaginationQuery {}

export interface GetTagsEndpointResult extends PaginatedResult {
  tags: PublicTag[];
}

export type GetTagsEndpoint = Endpoint<
  GetTagsEndpointParams,
  GetTagsEndpointResult
>;

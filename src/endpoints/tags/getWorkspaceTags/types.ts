import {PublicTag} from '../../../definitions/tag';
import {BaseContextType} from '../../contexts/types';
import {
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types';

export interface GetWorkspaceTagsEndpointParamsBase extends EndpointOptionalWorkspaceIDParam {}

export interface GetWorkspaceTagsEndpointParams
  extends GetWorkspaceTagsEndpointParamsBase,
    PaginationQuery {}

export interface GetWorkspaceTagsEndpointResult extends PaginatedResult {
  tags: PublicTag[];
}

export type GetWorkspaceTagsEndpoint = Endpoint<
  BaseContextType,
  GetWorkspaceTagsEndpointParams,
  GetWorkspaceTagsEndpointResult
>;

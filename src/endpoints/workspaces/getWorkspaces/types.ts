import {PublicWorkspace} from '../../../definitions/workspace.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginatedResult,
  PaginationQuery,
} from '../../types.js';

export interface GetWorkspacesEndpointParams
  extends PaginationQuery,
    EndpointOptionalWorkspaceIdParam {}

export interface GetWorkspacesEndpointResult extends PaginatedResult {
  workspaces: PublicWorkspace[];
}

export type GetWorkspacesEndpoint = Endpoint<
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult
>;

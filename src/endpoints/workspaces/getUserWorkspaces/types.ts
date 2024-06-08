import {PublicWorkspace} from '../../../definitions/workspace.js';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types.js';

export interface GetUserWorkspacesEndpointParams extends PaginationQuery {}

export interface GetUserWorkspacesEndpointResult extends PaginatedResult {
  workspaces: PublicWorkspace[];
}

export type GetUserWorkspacesEndpoint = Endpoint<
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult
>;

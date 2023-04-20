import {PublicWorkspace} from '../../../definitions/workspace';
import {BaseContext} from '../../contexts/types';
import {Endpoint, PaginatedResult, PaginationQuery} from '../../types';

export interface GetUserWorkspacesEndpointParams extends PaginationQuery {}

export interface GetUserWorkspacesEndpointResult extends PaginatedResult {
  workspaces: PublicWorkspace[];
}

export type GetUserWorkspacesEndpoint = Endpoint<
  BaseContext,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult
>;

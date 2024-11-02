import {PublicUser} from '../../../definitions/user.js';
import {
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
  PaginationQuery,
} from '../../types.js';

export interface GetUsersEndpointParams
  extends EndpointOptionalWorkspaceIdParam,
    PaginationQuery {}

export interface GetUsersEndpointResult {
  users: PublicUser[];
}

export type GetUsersEndpoint = Endpoint<
  GetUsersEndpointParams,
  GetUsersEndpointResult
>;

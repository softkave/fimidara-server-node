import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface UserExistsEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  email: string;
}

export interface UserExistsEndpointResult {
  exists: boolean;
}

export type UserExistsEndpoint = Endpoint<
  UserExistsEndpointParams,
  UserExistsEndpointResult
>;

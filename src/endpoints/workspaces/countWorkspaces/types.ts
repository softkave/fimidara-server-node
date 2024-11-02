import {
  CountItemsEndpointResult,
  Endpoint,
  EndpointOptionalWorkspaceIdParam,
} from '../../types.js';

export interface CountWorkspacesEndpointParams
  extends EndpointOptionalWorkspaceIdParam {}

export type CountWorkspacesEndpoint = Endpoint<
  CountWorkspacesEndpointParams,
  CountItemsEndpointResult
>;

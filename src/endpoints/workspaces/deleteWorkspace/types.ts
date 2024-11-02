import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface DeleteWorkspaceEndpointParams
  extends EndpointOptionalWorkspaceIdParam {}

export type DeleteWorkspaceEndpoint = Endpoint<
  DeleteWorkspaceEndpointParams,
  LongRunningJobResult
>;

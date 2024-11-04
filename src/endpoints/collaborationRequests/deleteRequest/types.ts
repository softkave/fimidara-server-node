import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface DeleteCollaborationRequestEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  requestId: string;
}

export type DeleteCollaborationRequestEndpoint = Endpoint<
  DeleteCollaborationRequestEndpointParams,
  LongRunningJobResult
>;

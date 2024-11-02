import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIdParam} from '../../types.js';

export interface RemoveCollaboratorEndpointParams
  extends EndpointOptionalWorkspaceIdParam {
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult
>;

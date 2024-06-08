import {LongRunningJobResult} from '../../jobs/types.js';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types.js';

export interface RemoveCollaboratorEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult
>;

import {LongRunningJobResult} from '../../jobs/types';
import {Endpoint, EndpointOptionalWorkspaceIDParam} from '../../types';

export interface RemoveCollaboratorEndpointParams
  extends EndpointOptionalWorkspaceIDParam {
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult
>;

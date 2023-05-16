import {BaseContextType} from '../../contexts/types';
import {LongRunningJobResult} from '../../jobs/types';
import {
  DeleteResourceCascadeFnDefaultArgs,
  Endpoint,
  EndpointOptionalWorkspaceIDParam,
} from '../../types';

export interface RemoveCollaboratorEndpointParams extends EndpointOptionalWorkspaceIDParam {
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  BaseContextType,
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult
>;

export type RemoveCollaboratorCascadeFnsArgs = DeleteResourceCascadeFnDefaultArgs & {
  userEmail: string;
  agentTokenId: string;
};

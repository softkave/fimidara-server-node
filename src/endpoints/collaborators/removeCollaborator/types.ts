import {BaseContext} from '../../contexts/types';
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
  BaseContext,
  RemoveCollaboratorEndpointParams,
  LongRunningJobResult
>;

export type RemoveCollaboratorCascadeFnsArgs = DeleteResourceCascadeFnDefaultArgs & {
  userEmail: string;
};

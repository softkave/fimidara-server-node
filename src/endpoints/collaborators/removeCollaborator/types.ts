import {IBaseContext} from '../../contexts/types';
import {ILongRunningJobResult} from '../../jobs/types';
import {
  DeleteResourceCascadeFnDefaultArgs,
  Endpoint,
  IEndpointOptionalWorkspaceIDParam,
} from '../../types';

export interface IRemoveCollaboratorEndpointParams extends IEndpointOptionalWorkspaceIDParam {
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IRemoveCollaboratorEndpointParams,
  ILongRunningJobResult
>;

export type RemoveCollaboratorCascadeFnsArgs = DeleteResourceCascadeFnDefaultArgs & {
  userEmail: string;
};

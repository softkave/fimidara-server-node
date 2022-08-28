import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export interface IRemoveCollaboratorEndpointParams {
  workspaceId?: string;
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IRemoveCollaboratorEndpointParams
>;

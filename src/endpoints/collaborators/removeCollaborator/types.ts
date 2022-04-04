import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IRemoveCollaboratorEndpointParams {
  organizationId: string;
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IRemoveCollaboratorEndpointParams
>;

import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IRemoveCollaboratorParams {
  organizationId: string;
  collaboratorId: string;
}

export type RemoveCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IRemoveCollaboratorParams
>;

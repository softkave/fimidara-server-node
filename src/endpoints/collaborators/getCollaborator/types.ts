import {IPublicCollaborator} from '../../../definitions/user';
import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IGetCollaboratorEndpointParams {
  workspaceId: string;
  collaboratorId: string;
}

export interface IGetCollaboratorEndpointResult {
  collaborator: IPublicCollaborator;
}

export type GetCollaboratorEndpoint = Endpoint<
  IBaseContext,
  IGetCollaboratorEndpointParams,
  IGetCollaboratorEndpointResult
>;
